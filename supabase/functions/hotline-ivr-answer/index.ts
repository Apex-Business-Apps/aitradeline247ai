import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const HOTLINE_ENABLED = Deno.env.get('HOTLINE_ENABLED') === 'true';
const HOTLINE_RECORDING_ENABLED = Deno.env.get('HOTLINE_RECORDING_ENABLED') === 'true';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate Twilio webhook signature (Phase H-I1: Security)
function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!TWILIO_AUTH_TOKEN) {
    console.error('[Security] TWILIO_AUTH_TOKEN not configured');
    return false;
  }

  // Sort params by key and build validation string
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  sortedKeys.forEach(key => {
    data += key + params[key];
  });

  // Create HMAC-SHA1 signature
  const hmac = createHmac('sha1', TWILIO_AUTH_TOKEN);
  hmac.update(data);
  const expectedSignature = hmac.digest('base64');

  const isValid = signature === expectedSignature;
  console.log('[Security] Signature validation:', isValid ? 'PASS' : 'FAIL');
  return isValid;
}

// Hash sensitive data for privacy (Phase H-I4: Abuse Guard)
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate TwiML for rate limit message (EN/FR-CA)
function generateRateLimitResponse(language: string): string {
  const messages = {
    en: 'We apologize, but we have received too many calls from your number. Please try again later or contact us via email. Thank you.',
    'fr-CA': 'Nous nous excusons, mais nous avons reçu trop d\'appels de votre numéro. Veuillez réessayer plus tard ou nous contacter par courriel. Merci.'
  };

  const message = messages[language as keyof typeof messages] || messages.en;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${language === 'fr-CA' ? 'fr-CA' : 'en-US'}">${message}</Say>
  <Hangup/>
</Response>`;
}

// Generate greeting TwiML with consent gate (Phase H-I3)
function generateGreetingWithConsent(callSid: string, language: string): string {
  const lang = language === 'fr-CA' ? 'fr-CA' : 'en-US';
  
  const greetings = {
    en: {
      greeting: 'Thank you for calling TradeLine 24/7. Your call may be recorded for quality and training purposes.',
      consent: 'Press 1 to consent and continue, or press 9 to opt out.',
      action: `${SUPABASE_URL}/functions/v1/hotline-consent-handler?CallSid=${callSid}&Language=en`
    },
    'fr-CA': {
      greeting: 'Merci d\'appeler TradeLine 24/7. Votre appel peut être enregistré à des fins de qualité et de formation.',
      consent: 'Appuyez sur 1 pour consentir et continuer, ou appuyez sur 9 pour refuser.',
      action: `${SUPABASE_URL}/functions/v1/hotline-consent-handler?CallSid=${callSid}&Language=fr-CA`
    }
  };

  const content = greetings[language as keyof typeof greetings] || greetings.en;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${content.action}" method="POST" timeout="10" numDigits="1">
    <Say language="${lang}">${content.greeting}</Say>
    <Pause length="1"/>
    <Say language="${lang}">${content.consent}</Say>
  </Gather>
  <Say language="${lang}">We did not receive your response. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[Hotline] Incoming request to IVR entry point');

  try {
    // Phase H-I1: Check if hotline is enabled
    if (!HOTLINE_ENABLED) {
      console.log('[Feature Flag] Hotline is disabled (HOTLINE_ENABLED=false)');
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This service is currently unavailable. Please try again later.</Say>
  <Hangup/>
</Response>`,
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
          status: 503
        }
      );
    }

    // Parse request body
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const callSid = params.CallSid;
    const from = params.From;
    const twilioSignature = req.headers.get('X-Twilio-Signature') || '';
    const requestUrl = req.url;

    console.log('[Call] CallSid:', callSid, 'From:', from);

    // Phase H-I1: Validate Twilio signature
    if (!validateTwilioSignature(twilioSignature, requestUrl, params)) {
      console.error('[Security] Invalid Twilio signature - rejecting request');
      return new Response('Forbidden', { status: 403 });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Hash sensitive data
    const aniHash = await hashData(from);
    const ipHash = await hashData(req.headers.get('x-forwarded-for') || 'unknown');

    // Phase H-I4: Check rate limits
    const { data: rateLimitResult } = await supabase.rpc('check_hotline_rate_limit', {
      p_ani_hash: aniHash,
      p_ip_hash: ipHash
    });

    if (rateLimitResult && !rateLimitResult.allowed) {
      console.log('[Rate Limit] Call blocked:', rateLimitResult.reason);
      
      // Log rate limit event
      await supabase.from('hotline_consent_audit').insert({
        call_sid: callSid,
        ani_hash: aniHash,
        consent_status: 'rate_limited',
        language: 'en',
        dtmf_input: null
      });

      // Detect language preference (simplified - could be enhanced)
      const language = params.ToCountry === 'CA' ? 'fr-CA' : 'en';
      
      return new Response(generateRateLimitResponse(language), {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
        status: 429
      });
    }

    // Create call session
    await supabase.from('hotline_call_sessions').insert({
      call_sid: callSid,
      ani_hash: aniHash,
      call_status: 'in-progress',
      language: params.ToCountry === 'CA' ? 'fr-CA' : 'en'
    });

    // Detect language (simplified - could use AI or more sophisticated detection)
    const language = params.ToCountry === 'CA' ? 'fr-CA' : 'en';

    // Phase H-I2 & H-I3: Generate greeting with consent gate
    const twiml = generateGreetingWithConsent(callSid, language);

    console.log('[Success] Returning greeting with consent gate');
    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
    });

  } catch (error) {
    console.error('[Error]', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We apologize, but we are experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`,
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
        status: 500
      }
    );
  }
});
