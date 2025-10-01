import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUSINESS_TARGET_E164 = Deno.env.get('BUSINESS_TARGET_E164') || '+15878839797';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate dial-to-support TwiML
function generateSupportDialTwiML(language: string): string {
  const lang = language === 'fr-CA' ? 'fr-CA' : 'en-US';
  const message = language === 'fr-CA'
    ? 'Connexion au soutien technique.'
    : 'Connecting you to support.';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}">${message}</Say>
  <Dial timeout="30" action="${SUPABASE_URL}/functions/v1/hotline-voicemail">
    <Number>${BUSINESS_TARGET_E164}</Number>
  </Dial>
</Response>`;
}

// Generate dial-to-sales TwiML
function generateSalesDialTwiML(language: string): string {
  const lang = language === 'fr-CA' ? 'fr-CA' : 'en-US';
  const message = language === 'fr-CA'
    ? 'Connexion aux ventes.'
    : 'Connecting you to sales.';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}">${message}</Say>
  <Dial timeout="30" action="${SUPABASE_URL}/functions/v1/hotline-voicemail">
    <Number>${BUSINESS_TARGET_E164}</Number>
  </Dial>
</Response>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[Route Handler] Processing routing selection');

  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const callSid = params.CallSid;
    const digits = params.Digits;
    const url = new URL(req.url);
    const language = url.searchParams.get('Language') || 'en';

    console.log('[Route] CallSid:', callSid, 'Digits:', digits, 'Language:', language);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Phase H-I2: Route based on DTMF input
    if (digits === '1') {
      // Route to support
      console.log('[Route] Routing to SUPPORT');
      
      await supabase.from('hotline_call_sessions')
        .update({ route_taken: 'support' })
        .eq('call_sid', callSid);

      const twiml = generateSupportDialTwiML(language);
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      });

    } else if (digits === '2') {
      // Route to sales
      console.log('[Route] Routing to SALES');
      
      await supabase.from('hotline_call_sessions')
        .update({ route_taken: 'sales' })
        .eq('call_sid', callSid);

      const twiml = generateSalesDialTwiML(language);
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      });

    } else {
      // Invalid input or timeout - redirect to voicemail
      console.log('[Route] Invalid input - redirecting to voicemail');
      
      await supabase.from('hotline_call_sessions')
        .update({ route_taken: 'voicemail' })
        .eq('call_sid', callSid);

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>${SUPABASE_URL}/functions/v1/hotline-voicemail?CallSid=${callSid}&Language=${language}</Redirect>
</Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

  } catch (error) {
    console.error('[Error]', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred. Please try again later.</Say>
  <Hangup/>
</Response>`,
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
        status: 500
      }
    );
  }
});
