import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignRequest {
  testName: string;
  anonId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const { testName, anonId }: AssignRequest = await req.json();
    
    if (!testName) {
      return new Response('Test name required', { status: 400, headers: corsHeaders });
    }

    // Get or create anonymous ID from cookie or generate new one
    const cookies = req.headers.get('cookie') || '';
    let anonymousId = anonId;
    
    if (!anonymousId) {
      const anonCookie = cookies.match(/anon_id=([^;]+)/);
      anonymousId = anonCookie ? anonCookie[1] : crypto.randomUUID();
    }

    console.log(`Processing A/B test assignment for test: ${testName}, anonId: ${anonymousId}`);

    // Check if user already has an assignment (sticky assignment)
    const { data: existingAssignment } = await supabase
      .from('ab_test_assignments')
      .select('variant')
      .eq('test_name', testName)
      .eq('user_session', anonymousId)
      .maybeSingle();

    let assignedVariant: string;

    if (existingAssignment) {
      assignedVariant = existingAssignment.variant;
      console.log(`Found existing assignment: ${assignedVariant}`);
    } else {
      // Get test configuration
      const { data: testConfig } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('test_name', testName)
        .eq('active', true)
        .maybeSingle();

      if (!testConfig) {
        console.log(`Test ${testName} not found or inactive, defaulting to variant A`);
        assignedVariant = 'A';
      } else {
        // Deterministic sticky bucket assignment using crypto hash
        const textEncoder = new TextEncoder();
        const data = textEncoder.encode(`${testName}:${anonymousId}`);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        const random = hashArray[0] / 255; // Convert to 0-1 range

        // Assign variant based on traffic split
        const variants = Object.keys(testConfig.traffic_split);
        const splits = Object.values(testConfig.traffic_split) as number[];
        
        let cumulative = 0;
        assignedVariant = variants[0];

        for (let i = 0; i < variants.length; i++) {
          cumulative += splits[i] / 100;
          if (random <= cumulative) {
            assignedVariant = variants[i];
            break;
          }
        }

        // Save assignment to database with conflict resolution
        const { error } = await supabase.from('ab_test_assignments').insert({
          test_name: testName,
          user_session: anonymousId,
          variant: assignedVariant
        });

        if (error) {
          // Handle duplicate key constraint violation (race condition)
          if (error.code === '23505') {
            console.log('Assignment already exists due to race condition, fetching existing');
            const { data: existingRaceAssignment } = await supabase
              .from('ab_test_assignments')
              .select('variant')
              .eq('test_name', testName)
              .eq('user_session', anonymousId)
              .maybeSingle();
            
            if (existingRaceAssignment) {
              assignedVariant = existingRaceAssignment.variant;
              console.log(`Using existing race assignment: ${assignedVariant}`);
            }
          } else {
            console.error('Error saving assignment:', error);
          }
        } else {
          console.log(`New assignment saved: ${testName} -> ${assignedVariant}`);
        }
      }
    }

    // Create HMAC signature for integrity
    const secret = Deno.env.get('AB_TEST_SECRET') || 'default-secret';
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureData = encoder.encode(`${testName}:${assignedVariant}:${anonymousId}`);
    const signature = await crypto.subtle.sign('HMAC', key, signatureData);
    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));

    // Set secure cookies
    const cookieOptions = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000';
    const integrityValue = `${assignedVariant}.${signatureBase64}`;
    
    const response = new Response(JSON.stringify({ 
      variant: assignedVariant,
      testName,
      anonId: anonymousId
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': `anon_id=${anonymousId}; ${cookieOptions}, exp_${testName}=${integrityValue}; ${cookieOptions}, exp_${testName}_v=${assignedVariant}; Path=/; Secure; SameSite=Lax; Max-Age=31536000`
      }
    });

    return response;

  } catch (error) {
    console.error('Error in secure-ab-assign:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});