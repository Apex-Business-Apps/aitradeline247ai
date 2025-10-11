// POST /webhooks-twilio-sms - Twilio SMS inbound webhook handler
// Normalizes payload and returns 200 (no auto-reply yet)

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
    
    // Normalize SMS payload
    const normalizedPayload = {
      eventType: 'sms_inbound',
      from: params.From || '',
      to: params.To || '',
      body: params.Body || '',
      messageSid: params.MessageSid || '',
      timestamp: new Date().toISOString()
    };
    
    console.log('Twilio SMS inbound:', {
      eventType: normalizedPayload.eventType,
      from: normalizedPayload.from.substring(0, 6) + '***', // Redacted
      to: normalizedPayload.to,
      messageSid: normalizedPayload.messageSid,
      bodyLength: normalizedPayload.body.length
    });
    
    // TODO: In later step, add STOP/START/HELP auto-reply logic
    // For now, just acknowledge receipt
    
    // Return empty TwiML response (no auto-reply)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
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
    
    console.error('Error in SMS webhook:', error.message);
    
    // Return empty response on error
    return new Response('', {
      status: 500,
      headers: corsHeaders
    });
  }
});
