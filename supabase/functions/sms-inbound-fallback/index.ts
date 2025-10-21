import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse form data
    const formData = await req.formData();
    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    console.log('⚠️ FALLBACK ACTIVATED', {
      messageSid,
      from,
      to,
      bodyLength: body?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Log fallback activation to analytics
    await supabase.from('analytics_events').insert({
      event_type: 'sms_inbound_fallback',
      event_data: {
        message_sid: messageSid,
        from_number: from,
        to_number: to,
        body_preview: body ? body.substring(0, 50) : null,
        reason: 'primary_webhook_unavailable',
        timestamp: new Date().toISOString()
      },
      severity: 'warning'
    });

    // Return empty TwiML response (fast 200 OK)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/xml'
        }
      }
    );

  } catch (error) {
    console.error('Fallback error:', error);
    
    // Even on error, return 200 to prevent Twilio retries
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/xml'
        }
      }
    );
  }
});

