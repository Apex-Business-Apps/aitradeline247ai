import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const HOTLINE_RECORDING_ENABLED = Deno.env.get('HOTLINE_RECORDING_ENABLED') === 'true';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate voicemail TwiML (Phase H-I2: Voicemail fallback)
function generateVoicemailTwiML(language: string, recordingEnabled: boolean): string {
  const lang = language === 'fr-CA' ? 'fr-CA' : 'en-US';
  
  const messages = {
    en: {
      prompt: 'All agents are currently busy. Please leave a message after the tone, and we will get back to you as soon as possible.',
      thankYou: 'Thank you for your message. Goodbye.'
    },
    'fr-CA': {
      prompt: 'Tous les agents sont actuellement occupés. Veuillez laisser un message après le bip, et nous vous rappellerons dès que possible.',
      thankYou: 'Merci pour votre message. Au revoir.'
    }
  };

  const content = messages[language as keyof typeof messages] || messages.en;

  // If recording is disabled, just thank them and hang up
  if (!recordingEnabled) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}">${content.prompt}</Say>
  <Pause length="1"/>
  <Say language="${lang}">${content.thankYou}</Say>
  <Hangup/>
</Response>`;
  }

  // If recording is enabled, record the message
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}">${content.prompt}</Say>
  <Record 
    maxLength="60" 
    timeout="5" 
    transcribe="true"
    action="${SUPABASE_URL}/functions/v1/voice-status"
  />
  <Say language="${lang}">${content.thankYou}</Say>
  <Hangup/>
</Response>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[Voicemail] Handling voicemail fallback');

  try {
    const url = new URL(req.url);
    const callSid = url.searchParams.get('CallSid');
    const language = url.searchParams.get('Language') || 'en';

    console.log('[Voicemail] CallSid:', callSid, 'Language:', language, 'Recording:', HOTLINE_RECORDING_ENABLED);

    if (callSid) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Update call session to mark voicemail route
      await supabase.from('hotline_call_sessions')
        .update({ 
          route_taken: 'voicemail',
          call_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('call_sid', callSid);
    }

    const twiml = generateVoicemailTwiML(language, HOTLINE_RECORDING_ENABLED);

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
    });

  } catch (error) {
    console.error('[Error]', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred. Goodbye.</Say>
  <Hangup/>
</Response>`,
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
        status: 500
      }
    );
  }
});
