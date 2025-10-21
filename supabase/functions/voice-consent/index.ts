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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const params: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const CallSid = params['CallSid'];
    const Digits = params['Digits'];

    console.log('Consent response:', { CallSid, Digits });

    // Check if caller declined (pressed 9)
    const consentGiven = Digits !== '9';

    // Update call log
    await supabase
      .from('call_logs')
      .update({ consent_given: consentGiven })
      .eq('call_sid', CallSid);

    let twiml: string;

    if (!consentGiven) {
      // No consent - continue without recording
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Recording disabled. How can we help you today?
  </Say>
  <Connect>
    <Stream url="wss://${supabaseUrl.replace('https://', '')}/functions/v1/voice-stream?callSid=${CallSid}" />
  </Connect>
</Response>`;
    } else {
      // Consent given - proceed with recording
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Thank you. How can we help you today?
  </Say>
  <Connect>
    <Stream url="wss://${supabaseUrl.replace('https://', '')}/functions/v1/voice-stream?callSid=${CallSid}" />
  </Connect>
</Response>`;
    }

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error handling consent:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we're experiencing technical difficulties.</Say>
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
