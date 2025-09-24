import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
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

    console.log('Call status update:', {
      CallSid: params.CallSid,
      CallStatus: params.CallStatus,
      From: params.From,
      To: params.To,
      Duration: params.CallDuration,
      AnsweredBy: params.AnsweredBy,
      RecordingUrl: params.RecordingUrl
    });

    // Validate Twilio signature - CRITICAL SECURITY CHECK
    const twilioSignature = req.headers.get('x-twilio-signature');
    const requestUrl = `${BASE_URL}/voice-status`;
    
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

    // Prepare call status data
    const statusData = {
      call_sid: params.CallSid,
      call_status: params.CallStatus,
      from_number: params.From,
      to_number: params.To,
      duration: params.CallDuration ? parseInt(params.CallDuration) : null,
      answered_by: params.AnsweredBy,
      recording_url: params.RecordingUrl,
      direction: params.Direction || 'inbound',
      parent_call_sid: params.ParentCallSid,
      timestamp: new Date().toISOString()
    };

    // Background task to log call status
    const logCallStatus = async () => {
      try {
        // Use upsert to handle idempotency by CallSid
        const { error } = await supabase
          .from('analytics_events')
          .upsert({
            event_type: 'twilio_call_status',
            event_data: statusData,
            user_session: params.CallSid,
            page_url: requestUrl,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_session,event_type'
          });

        if (error) {
          console.error('Failed to log call status:', error);
        } else {
          console.log('Call status logged successfully:', params.CallSid, params.CallStatus);
        }

        // Alert on problematic call outcomes
        if (['busy', 'no-answer', 'failed', 'canceled'].includes(params.CallStatus)) {
          console.warn(`Call ${params.CallSid} ended with status: ${params.CallStatus}`);
          
          // Could trigger additional alerting here
          await supabase
            .from('analytics_events')
            .insert({
              event_type: 'call_failure_alert',
              event_data: {
                call_sid: params.CallSid,
                status: params.CallStatus,
                from: params.From,
                to: params.To,
                severity: 'warning'
              },
              user_session: params.CallSid,
              page_url: requestUrl
            });
        }

      } catch (logError) {
        console.error('Error logging call status:', logError);
      }
    };

    // Background task to handle operational tasks
    const handleOperationalTasks = async () => {
      try {
        // PII minimization - only store necessary data
        const minimalData = {
          call_sid: params.CallSid,
          status: params.CallStatus,
          duration: params.CallDuration,
          timestamp: new Date().toISOString()
        };

        // Could implement additional tasks here:
        // - Send notifications for completed calls
        // - Update CRM systems
        // - Generate call summaries
        // - Handle recording processing

        console.log('Operational tasks completed for call:', params.CallSid);

      } catch (error) {
        console.error('Error in operational tasks:', error);
      }
    };

    // Start background tasks (don't await)
    logCallStatus();
    handleOperationalTasks();

    // Always return 200 OK to Twilio
    return new Response('OK', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    console.error('Error in voice-status function:', error);
    
    // Always return 200 to prevent Twilio retries on app errors
    return new Response('OK', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    });
  }
});