// POST /webhooks-twilio-recording-status - Recording status callback stub
// Logs recording events and returns 200

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
    
    // Log recording status (redact URL for security)
    console.log('Recording status callback:', {
      CallSid: params.CallSid,
      RecordingSid: params.RecordingSid,
      RecordingStatus: params.RecordingStatus,
      RecordingDuration: params.RecordingDuration,
      hasRecordingUrl: !!params.RecordingUrl
    });
    
    // TODO: Store recording metadata in database if needed
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error: any) {
    // If error is already a Response (from validator), return it
    if (error instanceof Response) {
      return error;
    }
    
    console.error('Error in recording status callback:', error.message);
    
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
