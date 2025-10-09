import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Twilio from "npm:twilio@5.9.0";

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
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    const { number_e164 } = await req.json();
    
    if (!number_e164 || !number_e164.startsWith('+')) {
      return new Response(
        JSON.stringify({ error: 'Valid E.164 number required (e.g., +15551234567)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Base URL for all webhooks
    const BASE_URL = 'https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1';

    // Find the phone number SID by searching for the number
    const phoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: number_e164,
      limit: 1
    });

    if (phoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: `Number ${number_e164} not found in your Twilio account` 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phoneSid = phoneNumbers[0].sid;

    // Update the phone number with TradeLine 24/7 webhook URLs
    const updatedNumber = await client.incomingPhoneNumbers(phoneSid).update({
      voiceUrl: `${BASE_URL}/voice-answer`,
      voiceMethod: 'POST',
      statusCallback: `${BASE_URL}/voice-status`,
      statusCallbackMethod: 'POST',
      smsUrl: `${BASE_URL}/webcomms-sms-reply`,
      smsMethod: 'POST',
      smsStatusCallback: `${BASE_URL}/webcomms-sms-status`
    });

    console.log(`✅ Attached number ${number_e164} (SID: ${phoneSid})`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        sid: phoneSid,
        number: number_e164,
        webhooks: {
          voice: `${BASE_URL}/voice-answer`,
          voiceStatus: `${BASE_URL}/voice-status`,
          sms: `${BASE_URL}/webcomms-sms-reply`,
          smsStatus: `${BASE_URL}/webcomms-sms-status`
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Attach number error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to attach number',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
