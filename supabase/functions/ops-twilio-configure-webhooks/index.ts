import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { phoneNumber, voiceUrl, voiceStatusCallback, smsUrl } = await req.json();
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    // Find the phone number SID
    const listResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phoneNumber)}`,
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
        }
      }
    );

    const listData = await listResponse.json();
    const phoneSid = listData.incoming_phone_numbers[0]?.sid;
    if (!phoneSid) throw new Error('Phone number not found');

    // Update webhooks
    const updateResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${phoneSid}.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          VoiceUrl: voiceUrl,
          VoiceStatusCallback: voiceStatusCallback,
          SmsUrl: smsUrl
        })
      }
    );

    if (!updateResponse.ok) throw new Error('Failed to update webhooks');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

