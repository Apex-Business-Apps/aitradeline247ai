import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
};

// Constants
const PUBLIC_DID_E164 = '+15877428885';
const FORWARD_TARGET_E164 = '+14319900222';
const BASE_URL = 'https://jbcxceojrztklnvwgyrq.supabase.co/functions/v1';

// Twilio webhook signature validation
function validateTwilioSignature(authToken: string, signature: string, url: string, params: any): boolean {
  try {
    // Simple validation - in production use proper crypto validation
    const expectedSig = signature.replace('sha1=', '');
    console.log('Validating Twilio signature for URL:', url);
    // For now, accept all requests from Twilio (implement proper validation in production)
    return true;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

// Generate TwiML response
function generateAnswerTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lucia">Hello. This call may be recorded to deliver your message and improve service. To continue, please stay on the line.</Say>
  <Dial timeout="25" answerOnBridge="true">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
  <Redirect method="POST">${BASE_URL}/voice-status</Redirect>
</Response>`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Get Twilio credentials
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!twilioAuthToken) {
      console.error('TWILIO_AUTH_TOKEN not configured');
      return new Response('Server configuration error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Parse form data from Twilio
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    console.log('Incoming call params:', {
      CallSid: params.CallSid,
      From: params.From,
      To: params.To,
      CallStatus: params.CallStatus
    });

    // Validate Twilio signature
    const twilioSignature = req.headers.get('x-twilio-signature');
    const requestUrl = `${BASE_URL}/voice-answer`;
    
    if (twilioSignature && !validateTwilioSignature(twilioAuthToken, twilioSignature, requestUrl, params)) {
      console.error('Invalid Twilio signature');
      return new Response('Forbidden', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log the incoming call
    const callData = {
      call_sid: params.CallSid,
      from_number: params.From,
      to_number: params.To,
      call_status: params.CallStatus || 'initiated',
      direction: 'inbound',
      event_type: 'call_initiated',
      created_at: new Date().toISOString()
    };

    // Background task to log call
    const logCall = async () => {
      try {
        const { error } = await supabase
          .from('analytics_events')
          .insert({
            event_type: 'twilio_call',
            event_data: callData,
            user_session: params.CallSid,
            page_url: requestUrl
          });

        if (error) {
          console.error('Failed to log call:', error);
        } else {
          console.log('Call logged successfully:', params.CallSid);
        }
      } catch (logError) {
        console.error('Error logging call:', logError);
      }
    };

    // Start background logging (don't await)
    logCall();

    // Generate and return TwiML response
    const twiml = generateAnswerTwiML();
    
    return new Response(twiml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('Error in voice-answer function:', error);
    
    // Return a fallback TwiML response
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lucia">Please hold while we connect you.</Say>
  <Dial timeout="25" answerOnBridge="true">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
</Response>`;

    return new Response(fallbackTwiML, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml; charset=utf-8'
      }
    });
  }
});