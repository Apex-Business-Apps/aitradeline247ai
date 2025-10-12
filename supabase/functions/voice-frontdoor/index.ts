import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting (Edge-compatible)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    // Validate Twilio signature and get params
    const params = await validateTwilioRequest(req, url.toString());
    
    const from = params.From || 'unknown';
    const callSid = params.CallSid || 'unknown';
    
    // Rate limiting by caller number and IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    if (!checkRateLimit(from) || !checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded: From=${from}, IP=${clientIp}`);
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're experiencing high call volume. Please try again later.</Say>
  <Hangup/>
</Response>`;
      
      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        status: 429,
      });
    }
    
    console.log('Front door: CallSid=%s From=%s', callSid, from);
    
    // Canadian consent disclosure with speech-based opt-out
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" 
          action="${supabaseUrl}/functions/v1/voice-consent-speech" 
          method="POST" 
          timeout="2" 
          language="en-CA"
          hints="opt out, no recording"
          speechTimeout="auto">
    <Say voice="Polly.Joanna" language="en-CA">
      This call may be recorded to improve service quality and keep accurate records. 
      Say opt out to continue without recording.
    </Say>
  </Gather>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-route?record=true</Redirect>
</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Front door error:', error);
    
    // Generic error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});
