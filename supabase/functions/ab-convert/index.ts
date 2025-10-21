import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConvertRequest {
  testName: string;
  conversionValue?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const { testName, conversionValue }: ConvertRequest = await req.json();
    
    if (!testName) {
      return new Response('Test name required', { status: 400, headers: corsHeaders });
    }

    // Verify signed cookie integrity
    const cookies = req.headers.get('cookie') || '';
    const anonIdCookie = cookies.match(/anon_id=([^;]+)/);
    const integrityCookie = cookies.match(new RegExp(`exp_${testName}=([^;]+)`));

    if (!anonIdCookie || !integrityCookie) {
      console.log('Missing required cookies for conversion');
      return new Response('Invalid cohort', { status: 400, headers: corsHeaders });
    }

    const anonymousId = anonIdCookie[1];
    const integrityValue = integrityCookie[1];
    const [variant, signature] = integrityValue.split('.');

    if (!variant || !signature) {
      console.log('Invalid integrity cookie format');
      return new Response('Invalid cohort', { status: 400, headers: corsHeaders });
    }

    // Verify HMAC signature
    const secret = Deno.env.get('AB_TEST_SECRET') || 'default-secret';
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureData = encoder.encode(`${testName}:${variant}:${anonymousId}`);
    
    try {
      const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, signatureData);
      
      if (!isValid) {
        console.log('Invalid HMAC signature for conversion');
        return new Response('Invalid cohort', { status: 400, headers: corsHeaders });
      }
    } catch (error) {
      console.log('HMAC verification error:', error);
      return new Response('Invalid cohort', { status: 400, headers: corsHeaders });
    }

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

    // Mark conversion (only if not already converted and belongs to this session)
    const { error } = await supabase
      .from('ab_test_assignments')
      .update({ converted: true })
      .eq('test_name', testName)
      .eq('user_session', anonymousId)
      .eq('variant', variant)
      .eq('converted', false);

    if (error) {
      console.error('Conversion update error:', error);
      return new Response('Error updating conversion', { status: 500, headers: corsHeaders });
    }

    // Track conversion in analytics (server-side only)
    await supabase.from('analytics_events').insert({
      event_type: 'ab_test_conversion',
      event_data: { 
        test_name: testName, 
        variant, 
        conversion_value: conversionValue 
      },
      user_session: anonymousId
    });

    console.log(`Conversion tracked: ${testName} -> ${variant}`);

    return new Response(null, { status: 204, headers: corsHeaders });

  } catch (error) {
    console.error('Error in ab-convert:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});
