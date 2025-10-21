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

    // Extract delivery status parameters
    const messageSid = params.MessageSid || params.SmsSid;
    const messageStatus = params.MessageStatus || params.SmsStatus;
    const from = params.From;
    const to = params.To;
    const errorCode = params.ErrorCode;
    const errorMessage = params.ErrorMessage;
    const price = params.Price;
    const priceUnit = params.PriceUnit;

    console.log('SMS status update:', { messageSid, messageStatus, errorCode, price });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update delivery log table
    await supabase.from('sms_delivery_log').upsert({
      message_sid: messageSid,
      to_e164: to,
      from_e164: from,
      status: messageStatus,
      status_updated_at: new Date().toISOString(),
      error_code: errorCode || null,
      error_message: errorMessage || null,
      price: price ? parseFloat(price) : null,
      price_unit: priceUnit || 'USD',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'message_sid'
    });
    
    // Also log to analytics_events for historical tracking
    await supabase.from('analytics_events').insert({
      event_type: 'sms_status',
      event_data: {
        message_sid: messageSid,
        status: messageStatus,
        from,
        to,
        error_code: errorCode,
        error_message: errorMessage,
        price,
        price_unit: priceUnit,
        timestamp: new Date().toISOString()
      },
      severity: errorCode ? 'error' : 'info'
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });

  } catch (error) {
    console.error('Error in sms-status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, // Return 200 to prevent Twilio retries
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  }
});

