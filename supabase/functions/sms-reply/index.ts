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

    // Validate Twilio signature
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

    // Extract SMS parameters
    const messageSid = params.MessageSid || params.SmsSid;
    const from = params.From;
    const to = params.To;
    const body = params.Body?.trim() || '';
    const numMedia = parseInt(params.NumMedia || '0');
    const accountSid = params.AccountSid;
    const optOutType = params.OptOutType;

    console.log('SMS received (webcomms):', { messageSid, from, to, body: body?.substring(0, 50), optOutType });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle opt-out keywords
    const bodyUpper = body.toUpperCase();
    
    if (optOutType === 'STOP' || ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(bodyUpper)) {
      console.log('Opt-out detected:', from);
      
      await supabase.from('consent_logs').insert({
        e164: from,
        status: 'revoked',
        channel: 'sms',
        source: 'keyword_stop'
      });
      
      await supabase.from('analytics_events').insert({
        event_type: 'sms_opt_out',
        event_data: {
          message_sid: messageSid,
          from,
          to,
          keyword: body,
          opt_out_type: optOutType,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      });

    } else if (optOutType === 'START' || ['START', 'UNSTOP', 'YES'].includes(bodyUpper)) {
      console.log('Opt-in detected:', from);
      
      await supabase.from('consent_logs').insert({
        e164: from,
        status: 'active',
        channel: 'sms',
        source: 'keyword_start'
      });
      
      await supabase.from('analytics_events').insert({
        event_type: 'sms_opt_in',
        event_data: {
          message_sid: messageSid,
          from,
          to,
          keyword: body,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      });
    } else {
      // Regular message
      await supabase.from('analytics_events').insert({
        event_type: 'sms_inbound',
        event_data: {
          message_sid: messageSid,
          from,
          to,
          body,
          num_media: numMedia,
          account_sid: accountSid,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      });
    }

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/xml' 
      }
    });

  } catch (error) {
    console.error('Error in sms-reply:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/xml' 
      }
    });
  }
});
