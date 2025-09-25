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
    console.log('Validating Twilio signature for status webhook');

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
    }
    
    return isValid;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

serve(async (req) => {
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

    // Parse form data from Twilio
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const statusInfo = {
      CallSid: params.CallSid,
      CallStatus: params.CallStatus,
      CallDuration: params.CallDuration,
      From: params.From,
      To: params.To
    };

    console.log('Call status update:', statusInfo);

    // Validate required parameters
    if (!params.CallSid) {
      console.error('Missing CallSid in status update');
      return new Response('Bad request', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Validate Twilio signature
    const twilioSignature = req.headers.get('x-twilio-signature');
    const requestUrl = `${BASE_URL}/voice-status-hardened`;
    
    if (!twilioSignature) {
      console.error('Missing Twilio signature header in status update');
      return new Response('Forbidden - Missing signature', { 
        status: 403, 
        headers: corsHeaders 
      });
    }
    
    const isValidSignature = await validateTwilioSignature(twilioAuthToken, twilioSignature, requestUrl, params);
    if (!isValidSignature) {
      console.error('Invalid Twilio signature in status update');
      return new Response('Forbidden - Invalid signature', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare call status data with minimal PII
    const callStatusData = {
      call_sid: params.CallSid,
      call_status: params.CallStatus,
      call_duration: params.CallDuration ? parseInt(params.CallDuration) : null,
      from_number: params.From,
      to_number: params.To,
      direction: 'inbound',
      event_type: 'call_status_update',
      timestamp: new Date().toISOString(),
      // Additional Twilio status fields
      answered_by: params.AnsweredBy,
      caller_name: params.CallerName,
      parent_call_sid: params.ParentCallSid,
      recording_url: params.RecordingUrl,
      recording_duration: params.RecordingDuration ? parseInt(params.RecordingDuration) : null
    };

    // Background tasks for logging and processing
    const backgroundTasks = async () => {
      try {
        // Upsert analytics event by CallSid for idempotency
        const { error: analyticsError } = await supabase
          .from('analytics_events')
          .upsert({
            id: params.CallSid, // Use CallSid as unique ID for idempotency
            event_type: 'twilio_call_status_hardened',
            event_data: callStatusData,
            user_session: params.CallSid,
            page_url: requestUrl,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (analyticsError) {
          console.error('Failed to log call status:', analyticsError);
        } else {
          console.log('Call status logged successfully:', params.CallSid);
        }

        // Check for failure conditions and send alerts
        const failureStatuses = ['busy', 'no-answer', 'failed', 'canceled'];
        if (failureStatuses.includes(params.CallStatus?.toLowerCase())) {
          console.log(`Call failure detected: ${params.CallStatus} for ${params.CallSid}`);
          
          // Trigger failure alert
          await supabase
            .from('analytics_events')
            .insert({
              event_type: 'call_failure_alert',
              event_data: {
                call_sid: params.CallSid,
                failure_reason: params.CallStatus,
                from: params.From,
                alert_timestamp: new Date().toISOString()
              },
              user_session: 'system',
              page_url: 'alert_system'
            });
        }

        // Log operational metrics
        if (params.CallDuration) {
          await supabase
            .from('operational_metrics')
            .insert({
              org_id: 'system',
              metric_name: 'call_duration_seconds',
              metric_value: parseInt(params.CallDuration),
              metric_unit: 'seconds'
            });
        }

        await supabase
          .from('operational_metrics')
          .insert({
            org_id: 'system',
            metric_name: 'call_status_update_count',
            metric_value: 1,
            metric_unit: 'count',
            metadata: { status: params.CallStatus }
          });

      } catch (error) {
        console.error('Error in background tasks:', error);
      }
    };

    // Start background tasks (non-blocking)
    backgroundTasks();

    // Return 200 OK immediately to prevent Twilio retries
    return new Response('OK', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    console.error('Error in voice-status-hardened function:', error);
    
    // Always return 200 to prevent Twilio retries, even on errors
    return new Response('OK', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
        'X-Error': 'handled'
      }
    });
  }
});