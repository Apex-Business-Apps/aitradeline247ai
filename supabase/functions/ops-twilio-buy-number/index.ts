import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const BASE_URL = Deno.env.get('SUPABASE_URL')?.replace('https://', '');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Missing Twilio credentials');
    }

    const { areaCode, country = 'US', organizationId } = await req.json();

    // Search for available numbers
    const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/${country}/Local.json?AreaCode=${areaCode}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
      }
    });

    const searchData = await searchResponse.json();
    
    if (!searchData.available_phone_numbers || searchData.available_phone_numbers.length === 0) {
      throw new Error('No numbers available in this area code');
    }

    const phoneNumber = searchData.available_phone_numbers[0].phone_number;

    // PROMPT B: Set all webhooks correctly
    const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;
    
    const purchaseResponse = await fetch(purchaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        PhoneNumber: phoneNumber,
        VoiceUrl: `https://${BASE_URL}/functions/v1/voice-answer`,
        StatusCallback: `https://${BASE_URL}/functions/v1/voice-status`,
        VoiceMethod: 'POST',
        StatusCallbackMethod: 'POST',
        SmsUrl: `https://${BASE_URL}/functions/v1/webcomms-sms-reply`,
        SmsMethod: 'POST',
        SmsStatusCallback: `https://${BASE_URL}/functions/v1/webcomms-sms-status`
      })
    });

    const purchaseData = await purchaseResponse.json();

    if (!purchaseResponse.ok) {
      throw new Error(purchaseData.message || 'Failed to purchase number');
    }

    console.log('Number purchased and configured:', purchaseData.sid);

    // PROMPT B & E: Store endpoint configuration in twilio_endpoints
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (organizationId) {
      await supabase.from('twilio_endpoints').upsert({
        number_e164: purchaseData.phone_number,
        organization_id: organizationId,
        phone_sid: purchaseData.sid,
        voice_url: `https://${BASE_URL}/functions/v1/voice-answer`,
        sms_url: `https://${BASE_URL}/functions/v1/webcomms-sms-reply`,
        call_status_callback: `https://${BASE_URL}/functions/v1/voice-status`,
        sms_status_callback: `https://${BASE_URL}/functions/v1/webcomms-sms-status`,
        stream_enabled: true
      }, { onConflict: 'number_e164' });

      // Log the purchase (Prompt F)
      await supabase.from('twilio_buy_number_logs').insert({
        organization_id: organizationId,
        number_e164: purchaseData.phone_number,
        phone_sid: purchaseData.sid,
        success: true
      });
    }

    return new Response(JSON.stringify({
      success: true,
      phoneSid: purchaseData.sid,
      number: purchaseData.phone_number,
      webhooksConfigured: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-twilio-buy-number:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

