// PROMPT D: SMS reply webhook - canonical path
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!twilioAuthToken) {
      throw new Error('TWILIO_AUTH_TOKEN not configured');
    }

    // Verify Twilio signature (Prompt D)
    const twilioSignature = req.headers.get('X-Twilio-Signature') || '';
    const url = `${new URL(req.url).origin}${new URL(req.url).pathname}`;
    
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    // Build signature string
    let dataString = url;
    Object.keys(params).sort().forEach(key => {
      dataString += key + params[key];
    });

    const hmac = createHmac('sha1', twilioAuthToken);
    hmac.update(dataString);
    const expectedSignature = hmac.digest('base64');

    if (twilioSignature !== expectedSignature) {
      console.error('Invalid Twilio signature');
      return new Response('Forbidden', { status: 403 });
    }

    const messageSid = params.MessageSid || params.SmsSid;
    const from = params.From;
    const to = params.To;
    const body = params.Body?.trim() || '';

    console.log('SMS received:', { messageSid, from, to, body: body?.substring(0, 50) });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert event row unique on (source='twilio', external_id=MessageSid) - Prompt D
    const { error: logError } = await supabase
      .from('sms_reply_logs')
      .upsert({
        message_sid: messageSid,
        from_e164: from,
        to_e164: to,
        body: body,
        source: 'twilio',
        external_id: messageSid
      }, {
        onConflict: 'source,external_id',
        ignoreDuplicates: false
      });

    if (logError) {
      console.error('Error logging SMS reply:', logError);
    }

    // Handle opt-out/opt-in keywords
    const bodyUpper = body.toUpperCase();
    if (['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(bodyUpper)) {
      await supabase.from('consent_logs').insert({
        e164: from,
        status: 'revoked',
        channel: 'sms',
        source: 'keyword_stop'
      });
    } else if (['START', 'UNSTOP', 'YES'].includes(bodyUpper)) {
      await supabase.from('consent_logs').insert({
        e164: from,
        status: 'active',
        channel: 'sms',
        source: 'keyword_start'
      });
    }

    // Return TwiML response
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/xml' 
      }
    });

  } catch (error) {
    console.error('Error in webcomms-sms-reply:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/xml' 
      }
    });
  }
});

