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

    // Validate Twilio signature for security (CRITICAL FIX)
    const twilioSignature = req.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      console.warn('Missing Twilio signature - rejecting request');
      return new Response('Forbidden', { status: 403 });
    }

    // CRITICAL: Validate HMAC signature from Twilio
    const url = new URL(req.url);
    const formData = await req.formData();
    const params: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    // Build signature validation string
    let signatureString = url.origin + url.pathname;
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      signatureString += key + params[key];
    }

    // Compute expected signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(TWILIO_AUTH_TOKEN);
    const messageData = encoder.encode(signatureString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // Compare signatures (constant-time comparison)
    if (expectedSignature !== twilioSignature) {
      console.error('Invalid Twilio signature - potential spoofing attempt');
      return new Response('Forbidden - Invalid Signature', { status: 403 });
    }

    console.log('✅ Twilio signature validated successfully');

    // Extract parameters (already parsed above for signature validation)
    const CallSid = params['CallSid'];
    const From = params['From'];
    const To = params['To'];

    // Input validation
    if (!CallSid || !From || !To) {
      console.error('Missing required Twilio parameters');
      return new Response('Bad Request', { status: 400 });
    }

    // Sanitize phone numbers (basic E.164 format check)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(From) || !e164Regex.test(To)) {
      console.error('Invalid phone number format');
      return new Response('Bad Request', { status: 400 });
    }

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
