// PROMPT D: SMS status callback - canonical path
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

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus;
    const errorCode = params.ErrorCode;
    const errorMessage = params.ErrorMessage;

    console.log('SMS status update:', { messageSid, messageStatus, errorCode });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert delivery state by MessageSid (Prompt D)
    const { error } = await supabase
      .from('sms_status_logs')
      .upsert({
        message_sid: messageSid,
        status: messageStatus,
        error_code: errorCode || null,
        error_message: errorMessage || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'message_sid',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error updating SMS status:', error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in webcomms-sms-status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
