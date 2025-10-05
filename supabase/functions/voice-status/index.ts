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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!TWILIO_AUTH_TOKEN) {
      throw new Error('Missing TWILIO_AUTH_TOKEN');
    }

    // Validate Twilio signature for security
    const twilioSignature = req.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      console.warn('Missing Twilio signature - rejecting request');
      return new Response(JSON.stringify({ error: 'Forbidden' }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse form data first (needed for signature validation)
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
      return new Response(JSON.stringify({ error: 'Forbidden - Invalid Signature' }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Twilio signature validated successfully');

    // Extract parameters (already parsed above)
    const CallSid = params['CallSid'];
    const CallStatus = params['CallStatus'];
    const CallDuration = params['CallDuration'];
    const From = params['From'];
    const To = params['To'];
    const RecordingUrl = params['RecordingUrl'];

    // Input validation
    if (!CallSid || !CallStatus) {
      console.error('Missing required Twilio parameters');
      return new Response(JSON.stringify({ error: 'Bad Request' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate call status is a known value
    const validStatuses = ['queued', 'ringing', 'in-progress', 'completed', 'busy', 'no-answer', 'canceled', 'failed'];
    if (!validStatuses.includes(CallStatus)) {
      console.error('Invalid call status:', CallStatus);
      return new Response(JSON.stringify({ error: 'Invalid status' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sanitize duration (must be a valid number)
    const duration = parseInt(CallDuration || '0');
    if (isNaN(duration) || duration < 0) {
      console.error('Invalid call duration');
      return new Response(JSON.stringify({ error: 'Invalid duration' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Call status update:', { CallSid, CallStatus, CallDuration });

    // Store in call_lifecycle table for tracking
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: upsertError } = await supabase
      .from('call_lifecycle')
      .upsert({
        call_sid: CallSid,
        from_number: From,
        to_number: To,
        status: CallStatus,
        direction: 'inbound',
        talk_seconds: duration,
        meta: {
          recording_url: RecordingUrl,
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'call_sid'
      });

    if (upsertError) {
      console.error('Error upserting call lifecycle:', upsertError);
    }

    // Log event for analytics
    await supabase.from('analytics_events').insert({
      event_type: 'twilio_call_status',
      event_data: {
        call_sid: CallSid,
        status: CallStatus,
        duration: CallDuration,
        from: From,
        to: To,
        recording_url: RecordingUrl,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    // Return 200 OK for idempotency
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing call status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
