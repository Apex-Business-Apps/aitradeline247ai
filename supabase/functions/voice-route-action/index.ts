import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const opsNumber = Deno.env.get('OPS_NUMBER') || Deno.env.get('BUSINESS_TARGET_E164');
    
    if (!opsNumber) {
      throw new Error('Missing OPS_NUMBER or BUSINESS_TARGET_E164');
    }
    
    // Validate Twilio signature and get params
    const params = await validateTwilioRequest(req, url.toString());
    
    const callSid = params.CallSid || 'unknown';
    const dialCallStatus = params.DialCallStatus || 'unknown';
    const recordParam = url.searchParams.get('record') || 'true';
    const shouldRecord = recordParam === 'true';
    
    console.log('Voice route action: CallSid=%s DialStatus=%s Record=%s', 
      callSid, dialCallStatus, shouldRecord);
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update call log with action result
    await supabase.from('call_logs').update({
      handoff: true,
      handoff_reason: `ai_timeout_or_fallback_${dialCallStatus}`,
      status: dialCallStatus === 'completed' ? 'completed' : 'routing_fallback'
    }).eq('call_sid', callSid).catch(err => {
      console.error('Failed to update call log:', err);
    });
    
    // If AI didn't handle it, fallback to human
    if (dialCallStatus !== 'completed' && dialCallStatus !== 'in-progress') {
      const recordAttr = shouldRecord ? 'record-from-answer-dual' : 'do-not-record';
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Transferring you to our team.</Say>
  <Dial action="${supabaseUrl}/functions/v1/voice-status" 
        timeout="30" 
        record="${recordAttr}">
    <Number statusCallback="${supabaseUrl}/functions/v1/voice-status" 
            statusCallbackEvent="initiated ringing answered completed">${opsNumber}</Number>
  </Dial>
  <Say voice="Polly.Joanna">We're sorry, but no one is available. Please try again later.</Say>
  <Hangup/>
</Response>`;
      
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }
    
    // AI handled it, just hang up
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
    
    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Voice route action error:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});

