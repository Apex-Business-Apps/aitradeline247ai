// DRIFT-03: One-click unsubscribe Edge Function (CASL compliant)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse URL to get email parameter
    const url = new URL(req.url);
    const email = url.searchParams.get('e');
    
    // For POST requests (List-Unsubscribe-Post: One-Click)
    let postEmail: string | null = null;
    if (req.method === 'POST') {
      const body = await req.text();
      const params = new URLSearchParams(body);
      postEmail = params.get('e');
    }

    const targetEmail = email || postEmail;

    if (!targetEmail) {
      console.error('Unsubscribe: No email provided');
      return new Response(
        JSON.stringify({ error: 'Email parameter required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      console.error('Unsubscribe: Invalid email format:', targetEmail);
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client IP for audit trail
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log('Processing unsubscribe for:', targetEmail, 'from IP:', clientIP);

    // Insert into unsubscribes table (idempotent - ON CONFLICT DO NOTHING via unique constraint)
    const { error: insertError } = await supabase
      .from('unsubscribes')
      .upsert({
        email: targetEmail.toLowerCase().trim(),
        source: req.method === 'POST' ? 'one_click' : 'link',
        ip_address: clientIP,
        unsubscribed_at: new Date().toISOString(),
      }, {
        onConflict: 'email',
        ignoreDuplicates: false, // Update if exists
      });

    if (insertError) {
      console.error('Unsubscribe DB error:', insertError);
      
      // Still return 200 for idempotency (already unsubscribed is success)
      if (insertError.code === '23505') { // unique_violation
        console.log('Email already unsubscribed:', targetEmail);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Already unsubscribed',
            email: targetEmail 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw insertError;
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      event_type: 'email_unsubscribe',
      event_data: {
        email: targetEmail,
        source: req.method === 'POST' ? 'one_click' : 'link',
        ip: clientIP,
        timestamp: new Date().toISOString(),
      },
      severity: 'info',
    });

    console.log('Successfully unsubscribed:', targetEmail);

    // Return 200 immediately (as per RFC 8058 for one-click)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Successfully unsubscribed',
        email: targetEmail 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unsubscribe function error:', error);
    
    // Still return 200 to avoid retry loops
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal error',
        message: 'Request received but processing failed' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
