import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const FORWARD_TARGET_E164 = Deno.env.get('BUSINESS_TARGET_E164');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!TWILIO_AUTH_TOKEN || !FORWARD_TARGET_E164) {
      throw new Error('Missing required environment variables');
    }

    // Validate Twilio signature for security
    const twilioSignature = req.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      console.warn('Missing Twilio signature');
      return new Response('Forbidden', { status: 403 });
    }

    const formData = await req.formData();
    const CallSid = formData.get('CallSid') as string;
    const From = formData.get('From') as string;
    const To = formData.get('To') as string;

    console.log('Incoming call:', { CallSid, From, To });

    // Log to Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('analytics_events').insert({
      event_type: 'twilio_call_incoming',
      event_data: {
        call_sid: CallSid,
        from: From,
        to: To,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    // Generate TwiML response with consent and forwarding
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    This call is being recorded for quality and training purposes. 
    By staying on the line, you consent to being recorded.
  </Say>
  <Dial callerId="${To}" record="record-from-answer" recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-status">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
</Response>`;

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error handling call:', error);
    
    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  }
});
