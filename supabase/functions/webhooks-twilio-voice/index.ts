// POST /webhooks-twilio-voice - Twilio voice webhook handler
// Returns TwiML for greeting + voicemail recording

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Construct full URL for signature validation
    const url = new URL(req.url);
    const fullUrl = `https://${url.host}${url.pathname}${url.search}`;
    
    // Validate Twilio signature and parse params
    const params = await validateTwilioRequest(req, fullUrl);
    
    console.log('Twilio voice webhook:', {
      CallSid: params.CallSid,
      From: params.From?.substring(0, 6) + '***', // Redacted
      To: params.To,
      CallStatus: params.CallStatus
    });
    
    // Generate TwiML response
    const recordingStatusCallback = `https://${url.host}/functions/v1/webhooks-twilio-recording-status`;
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Thank you for calling. Please leave a message after the tone, and we'll get back to you soon.
  </Say>
  <Record 
    maxLength="120" 
    playBeep="true" 
    recordingStatusCallback="${recordingStatusCallback}"
    recordingStatusCallbackMethod="POST"
  />
  <Say voice="Polly.Joanna">
    Thank you. Goodbye.
  </Say>
</Response>`;
    
    return new Response(twiml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8'
      }
    });
    
  } catch (error: any) {
    // If error is already a Response (from validator), return it
    if (error instanceof Response) {
      return error;
    }
    
    console.error('Error in voice webhook:', error.message);
    
    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    We're sorry, but we're experiencing technical difficulties. Please try again later.
  </Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8'
      }
    });
  }
});

