import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Constants
const PUBLIC_DID_E164 = '+15877428885';
const FORWARD_TARGET_E164 = '+14319900222';
const BASE_URL = 'https://jbcxceojrztklnvwgyrq.supabase.co/functions/v1';

// Twilio webhook signature validation using HMAC-SHA1
async function validateTwilioSignature(authToken: string, signature: string, url: string, params: Record<string, string>): Promise<boolean> {
  try {
    if (!signature || !signature.startsWith('sha1=')) {
      console.error('Missing or invalid Twilio signature format');
      return false;
    }

    // Create the expected signature string from URL + sorted params
    const sortedParams = Object.keys(params).sort().reduce((result: string[], key: string) => {
      result.push(`${key}=${params[key]}`);
      return result;
    }, []);
    
    const data = url + sortedParams.join('');
    console.log('Validating Twilio signature for URL:', url);

    // Create HMAC-SHA1 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(authToken),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const receivedSignature = signature.replace('sha1=', '');
    const isValid = expectedSignature === receivedSignature;
    
    if (!isValid) {
      console.error('Twilio signature validation failed');
      console.error('Expected:', expectedSignature);
      console.error('Received:', receivedSignature);
    }
    
    return isValid;
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
  <Dial timeout="25" answerOnBridge="true" statusCallback="${BASE_URL}/voice-status" statusCallbackEvent="initiated ringing answered completed">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
  <Say voice="Polly.Lucia">We're unable to connect your call right now. Please try again later.</Say>
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

    // Validate Twilio signature - CRITICAL SECURITY CHECK
    const twilioSignature = req.headers.get('x-twilio-signature');
    const requestUrl = `${BASE_URL}/voice-answer`;
    
    if (!twilioSignature) {
      console.error('Missing Twilio signature header');
      return new Response('Forbidden', { 
        status: 403, 
        headers: corsHeaders 
      });
    }
    
    const isValidSignature = await validateTwilioSignature(twilioAuthToken, twilioSignature, requestUrl, params);
    if (!isValidSignature) {
      console.error('Invalid Twilio signature - rejecting request');
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
  <Dial timeout="25" answerOnBridge="true" statusCallback="${BASE_URL}/voice-status" statusCallbackEvent="initiated ringing answered completed">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
  <Say voice="Polly.Lucia">We're unable to connect your call right now. Please try again later.</Say>
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