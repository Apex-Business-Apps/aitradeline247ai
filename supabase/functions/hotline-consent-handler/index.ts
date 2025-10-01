import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const HOTLINE_RECORDING_ENABLED = Deno.env.get('HOTLINE_RECORDING_ENABLED') === 'true';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate IVR menu TwiML (Phase H-I2)
function generateIVRMenu(callSid: string, language: string): string {
  const lang = language === 'fr-CA' ? 'fr-CA' : 'en-US';
  
  const menus = {
    en: {
      prompt: 'For support, press 1. For sales, press 2.',
      action: `${SUPABASE_URL}/functions/v1/hotline-route-handler?CallSid=${callSid}&Language=en`
    },
    'fr-CA': {
      prompt: 'Pour le soutien, appuyez sur 1. Pour les ventes, appuyez sur 2.',
      action: `${SUPABASE_URL}/functions/v1/hotline-route-handler?CallSid=${callSid}&Language=fr-CA`
    }
  };

  const content = menus[language as keyof typeof menus] || menus.en;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${content.action}" method="POST" timeout="10" numDigits="1">
    <Say language="${lang}">${content.prompt}</Say>
  </Gather>
  <Say language="${lang}">We did not receive your selection. Redirecting to voicemail.</Say>
  <Redirect>${SUPABASE_URL}/functions/v1/hotline-voicemail?CallSid=${callSid}&Language=${language}</Redirect>
</Response>`;
}

// Generate opt-out message
function generateOptOutMessage(language: string): string {
  const lang = language === 'fr-CA' ? 'fr-CA' : 'en-US';
  
  const messages = {
    en: 'You have opted out. Thank you for calling. Goodbye.',
    'fr-CA': 'Vous avez refusé. Merci d\'avoir appelé. Au revoir.'
  };

  const message = messages[language as keyof typeof messages] || messages.en;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}">${message}</Say>
  <Hangup/>
</Response>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[Consent Handler] Processing consent response');

  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const callSid = params.CallSid;
    const digits = params.Digits;
    const from = params.From;
    const url = new URL(req.url);
    const language = url.searchParams.get('Language') || 'en';

    console.log('[Consent] CallSid:', callSid, 'Digits:', digits, 'Language:', language);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const aniHash = await hashData(from);

    // Phase H-I3: Process consent response
    if (digits === '1') {
      // Consent granted
      console.log('[Consent] User granted consent');
      
      await supabase.from('hotline_consent_audit').insert({
        call_sid: callSid,
        ani_hash: aniHash,
        consent_status: 'granted',
        language: language,
        dtmf_input: digits
      });

      await supabase.from('hotline_call_sessions')
        .update({ consent_given: true })
        .eq('call_sid', callSid);

      // Proceed to IVR menu
      const twiml = generateIVRMenu(callSid, language);
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      });

    } else if (digits === '9') {
      // Consent denied - opt out
      console.log('[Consent] User opted out');
      
      await supabase.from('hotline_consent_audit').insert({
        call_sid: callSid,
        ani_hash: aniHash,
        consent_status: 'denied',
        language: language,
        dtmf_input: digits
      });

      await supabase.from('hotline_call_sessions')
        .update({ 
          consent_given: false,
          call_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);

      const twiml = generateOptOutMessage(language);
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      });

    } else {
      // Invalid input or timeout
      console.log('[Consent] Invalid input or timeout');
      
      await supabase.from('hotline_consent_audit').insert({
        call_sid: callSid,
        ani_hash: aniHash,
        consent_status: 'timeout',
        language: language,
        dtmf_input: digits || null
      });

      const lang = language === 'fr-CA' ? 'fr-CA' : 'en-US';
      const message = language === 'fr-CA' 
        ? 'Nous n\'avons pas reçu de réponse valide. Au revoir.'
        : 'We did not receive a valid response. Goodbye.';

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}">${message}</Say>
  <Hangup/>
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
