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
    const FORWARD_TARGET_E164 = Deno.env.get('BUSINESS_TARGET_E164');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!TWILIO_AUTH_TOKEN || !FORWARD_TARGET_E164) {
      throw new Error('Missing required environment variables');
    }

    // CRITICAL: Enforce E.164 format for bridge target
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(FORWARD_TARGET_E164)) {
      console.error('CRITICAL: BUSINESS_TARGET_E164 is not in valid E.164 format:', FORWARD_TARGET_E164);
      throw new Error('Invalid bridge target configuration - must be E.164 format');
    }

    // Validate Twilio signature for security
    const twilioSignature = req.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      console.warn('Missing Twilio signature - rejecting request');
      return new Response('Forbidden', { status: 403 });
    }

    // CRITICAL: Validate HMAC signature from Twilio
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

    // Compare signatures
    if (expectedSignature !== twilioSignature) {
      console.error('Invalid Twilio signature - potential spoofing attempt');
      return new Response('Forbidden - Invalid Signature', { status: 403 });
    }

    console.log('✅ Twilio signature validated successfully');

    // Extract parameters
    const CallSid = params['CallSid'];
    const From = params['From'];
    const To = params['To'];
    const AnsweredBy = params['AnsweredBy']; // AMD result

    // Input validation
    if (!CallSid || !From || !To) {
      console.error('Missing required Twilio parameters');
      return new Response('Bad Request', { status: 400 });
    }

    // Sanitize phone numbers
    if (!e164Regex.test(From) || !e164Regex.test(To)) {
      console.error('Invalid phone number format');
      return new Response('Bad Request', { status: 400 });
    }

    console.log('Incoming call:', { CallSid, From, To, AnsweredBy });

    // Get voice config
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: config } = await supabase
      .from('voice_config')
      .select('*')
      .single();

    // Create call log
    await supabase.from('call_logs').insert({
      call_sid: CallSid,
      from_e164: From,
      to_e164: To,
      started_at: new Date().toISOString(),
      status: 'initiated',
      amd_detected: AnsweredBy === 'machine_start' || AnsweredBy === 'machine_end_beep',
    });

    // AMD Detection: If voicemail detected, use LLM path
    const isVoicemail = AnsweredBy === 'machine_start' || AnsweredBy === 'machine_end_beep';
    const pickupMode = config?.pickup_mode || 'immediate';
    const amdEnabled = config?.amd_enable !== false;
    const failOpen = config?.fail_open !== false;

    // Determine if we should use LLM or bridge
    const useLLM = isVoicemail && amdEnabled;
    
    let twiml: string;

    // Check concurrent stream limit (max 10 per org to prevent overload)
    const { count: activeStreams } = await supabase
      .from('voice_stream_logs')
      .select('*', { count: 'exact', head: true })
      .is('connected_at', null)
      .gte('started_at', new Date(Date.now() - 30000).toISOString()); // Last 30s
    
    const realtimeEnabled = config?.stream_enabled !== false;
    const withinConcurrencyLimit = (activeStreams || 0) < 10;

    if ((useLLM || pickupMode === 'immediate') && realtimeEnabled && withinConcurrencyLimit) {
      // Greeting + realtime stream with 3s watchdog fallback
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-action" numDigits="1" timeout="1">
    <Say voice="Polly.Joanna">
      Hi, you've reached TradeLine 24/7 — Your 24/7 AI Receptionist! How can I help? Press 0 to speak with someone directly.
    </Say>
  </Gather>
  <Connect action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-answer?fallback=true">
    <Stream url="wss://${supabaseUrl.replace('https://', '')}/functions/v1/voice-stream?callSid=${CallSid}" />
  </Connect>
  <Say voice="Polly.Joanna">Connecting you to an agent now.</Say>
  <Dial callerId="${To}" record="record-from-answer" recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-status">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
</Response>`;
    } else {
      // Bridge directly to human
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hi, you've reached TradeLine 24/7 — Your 24/7 AI Receptionist! Connecting you now.
  </Say>
  <Dial callerId="${To}" record="record-from-answer" recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-status">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
</Response>`;
    }

    // Update call log with mode
    await supabase.from('call_logs')
      .update({ 
        mode: (useLLM || pickupMode === 'immediate') && realtimeEnabled && withinConcurrencyLimit ? 'llm' : 'bridge',
        pickup_mode: pickupMode 
      })
      .eq('call_sid', CallSid);

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error handling call:', error);
    
    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  }
});
