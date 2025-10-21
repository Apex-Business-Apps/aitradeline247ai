import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const opsNumber = Deno.env.get('OPS_NUMBER') || Deno.env.get('BUSINESS_TARGET_E164');
    const aiWebhook = Deno.env.get('ENV_AI_WEBHOOK');
    const twilioStreamUrl = Deno.env.get('ENV_TWILIO_STREAM_URL');
    
    if (!opsNumber) {
      throw new Error('Missing OPS_NUMBER or BUSINESS_TARGET_E164');
    }
    
    // Validate Twilio signature and get params
    const params = await validateTwilioRequest(req, url.toString());
    
    const callSid = params.CallSid || url.searchParams.get('callSid') || 'unknown';
    const from = params.From || 'unknown';
    const to = params.To || 'unknown';
    const recordParam = url.searchParams.get('record') || 'true';
    const shouldRecord = recordParam === 'true';
    
    console.log('Voice route: CallSid=%s Record=%s From=%s To=%s', 
      callSid, shouldRecord, from, to);
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Log call routing decision
    await supabase.from('call_logs').insert({
      call_sid: callSid,
      from_e164: from,
      to_e164: to,
      mode: aiWebhook || twilioStreamUrl ? 'ai_first' : 'direct_dial',
      consent_given: shouldRecord,
      status: 'routing'
    }).catch(err => {
      console.error('Failed to log call routing:', err);
    });
    
    // Determine recording attribute based on consent
    const recordAttr = shouldRecord ? 'record-from-answer-dual' : 'do-not-record';
    
    // Build TwiML with AI-first approach (if configured) or direct dial
    let twiml: string;
    
    if (twilioStreamUrl) {
      // Use Twilio Media Streams for real-time AI
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Connecting you now.</Say>
  <Connect action="${supabaseUrl}/functions/v1/voice-route-action?record=${recordParam}">
    <Stream url="${twilioStreamUrl}">
      <Parameter name="callSid" value="${callSid}"/>
      <Parameter name="record" value="${shouldRecord}"/>
    </Stream>
  </Connect>
</Response>`;
    } else if (aiWebhook) {
      // Use AI webhook (6 second timeout)
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial action="${supabaseUrl}/functions/v1/voice-route-action?record=${recordParam}" 
        timeout="6" 
        record="${recordAttr}">
    <Number url="${aiWebhook}">${opsNumber}</Number>
  </Dial>
</Response>`;
    } else {
      // Direct dial to ops number
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Connecting you to our team.</Say>
  <Dial action="${supabaseUrl}/functions/v1/voice-status" 
        timeout="30" 
        record="${recordAttr}"
        callerId="${to}">
    <Number statusCallback="${supabaseUrl}/functions/v1/voice-status" 
            statusCallbackEvent="initiated ringing answered completed">${opsNumber}</Number>
  </Dial>
  <Say voice="Polly.Joanna">We're sorry, but no one is available to take your call. Please try again later.</Say>
  <Hangup/>
</Response>`;
    }

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Voice route error:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});

