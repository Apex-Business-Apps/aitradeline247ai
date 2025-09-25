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

// PIPEDA compliant consent message
const CONSENT_MESSAGE = "Hello. This call may be recorded or transcribed to deliver your message and improve our service quality. Your privacy is important to us and we follow Canadian privacy laws. To continue, please stay on the line.";

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

// Generate PIPEDA compliant TwiML response
function generateConsentTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lucia">${CONSENT_MESSAGE}</Say>
  <Pause length="1"/>
  <Dial timeout="25" answerOnBridge="true" statusCallback="${BASE_URL}/voice-status-hardened" statusCallbackEvent="initiated ringing answered completed">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
  <Say voice="Polly.Lucia">We're unable to connect your call right now. Please try again later or visit our website.</Say>
</Response>`;
}

// Log consent record for PIPEDA compliance
async function logConsentRecord(supabase: any, callerNumber: string, callSid: string) {
  try {
    await supabase
      .from('consent_records')
      .insert({
        org_id: 'system', // System org for consent tracking
        contact_identifier: callerNumber,
        consent_type: 'recording',
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
        source: 'call',
        metadata: {
          call_sid: callSid,
          consent_method: 'implied_by_continuing',
          privacy_notice_provided: true
        }
      });
  } catch (error) {
    console.error('Failed to log consent record:', error);
  }
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.error(`Invalid method: ${req.method}`);
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

    // Parse form data from Twilio with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 1500)
    );
    
    const formDataPromise = req.formData();
    const formData = await Promise.race([formDataPromise, timeoutPromise]) as FormData;
    
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const callInfo = {
      CallSid: params.CallSid,
      From: params.From,
      To: params.To,
      CallStatus: params.CallStatus
    };

    console.log('Incoming call:', callInfo);

    // Validate required parameters
    if (!params.CallSid || !params.From || !params.To) {
      console.error('Missing required Twilio parameters');
      return new Response('Bad request', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Validate Twilio signature - CRITICAL SECURITY CHECK
    const twilioSignature = req.headers.get('x-twilio-signature');
    const requestUrl = `${BASE_URL}/voice-answer-hardened`;
    
    if (!twilioSignature) {
      console.error('Missing Twilio signature header');
      return new Response('Forbidden - Missing signature', { 
        status: 403, 
        headers: corsHeaders 
      });
    }
    
    const isValidSignature = await validateTwilioSignature(twilioAuthToken, twilioSignature, requestUrl, params);
    if (!isValidSignature) {
      console.error('Invalid Twilio signature - potential security threat');
      return new Response('Forbidden - Invalid signature', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    console.log('Twilio signature validated successfully');

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log the incoming call with minimal PII
    const callData = {
      call_sid: params.CallSid,
      from_number: params.From,
      to_number: params.To,
      call_status: params.CallStatus || 'initiated',
      direction: 'inbound',
      event_type: 'call_initiated',
      created_at: new Date().toISOString()
    };

    // Background tasks (don't await)
    const backgroundTasks = Promise.all([
      // Log call analytics
      supabase
        .from('analytics_events')
        .insert({
          event_type: 'twilio_call_hardened',
          event_data: callData,
          user_session: params.CallSid,
          page_url: requestUrl
        }),
      
      // Log consent record for PIPEDA compliance
      logConsentRecord(supabase, params.From, params.CallSid),
      
      // Log operational metrics
      supabase
        .from('operational_metrics')
        .insert({
          org_id: 'system',
          metric_name: 'voice_answer_latency_ms',
          metric_value: Date.now() - startTime,
          metric_unit: 'milliseconds'
        })
    ]);

    // Start background logging (non-blocking)
    backgroundTasks.catch(error => {
      console.error('Background task error:', error);
    });

    // Generate and return TwiML response quickly (<2s requirement)
    const twiml = generateConsentTwiML();
    
    const responseTime = Date.now() - startTime;
    console.log(`TwiML response generated in ${responseTime}ms for call ${params.CallSid}`);
    
    return new Response(twiml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml; charset=utf-8',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Error in voice-answer-hardened function:', error);
    
    // Return a fallback TwiML response even on error
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lucia">Thank you for calling. Please hold while we connect you.</Say>
  <Dial timeout="25" answerOnBridge="true" statusCallback="${BASE_URL}/voice-status-hardened" statusCallbackEvent="initiated ringing answered completed">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
  <Say voice="Polly.Lucia">We're unable to connect your call right now. Please try again later.</Say>
</Response>`;

    return new Response(fallbackTwiML, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml; charset=utf-8',
        'X-Response-Time': `${responseTime}ms`,
        'X-Error': 'fallback-response'
      }
    });
  }
});