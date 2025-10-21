import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    
    // Validate Twilio signature and get params
    const params = await validateTwilioRequest(req, url.toString());
    
    const callSid = params.CallSid || 'unknown';
    const speechResult = params.SpeechResult?.toLowerCase() || '';
    const confidence = parseFloat(params.Confidence || '0');
    
    console.log('Consent speech: CallSid=%s Speech="%s" Confidence=%s', 
      callSid, speechResult, confidence);
    
    // Check if caller said "opt out" or similar phrases
    const optOutPhrases = ['opt out', 'no recording', 'don\'t record', 'no record'];
    const userOptedOut = optOutPhrases.some(phrase => speechResult.includes(phrase));
    
    const recordParam = userOptedOut ? 'false' : 'true';
    
    console.log('Consent decision: CallSid=%s OptOut=%s Record=%s', 
      callSid, userOptedOut, recordParam);
    
    // Redirect to routing logic
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-route?record=${recordParam}&amp;callSid=${callSid}</Redirect>
</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Consent speech error:', error);
    
    // On error, default to recording enabled and continue
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-route?record=true</Redirect>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});

