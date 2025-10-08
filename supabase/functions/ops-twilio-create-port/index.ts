import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const BASE_URL = supabaseUrl.replace('https://', '');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Missing Twilio credentials');
    }

    const { phoneNumber, loaDocument, billDocument } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate FOC date (typically 7-10 business days out)
    const focDate = new Date();
    focDate.setDate(focDate.getDate() + 7);

    // Purchase temporary DID for zero-downtime cutover
    const tempSearchUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/US/Local.json?Limit=1`;
    
    const tempSearchResponse = await fetch(tempSearchUrl, {
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
      }
    });

    const tempSearchData = await tempSearchResponse.json();
    const tempNumber = tempSearchData.available_phone_numbers[0]?.phone_number;

    if (!tempNumber) {
      throw new Error('No temporary numbers available');
    }

    // Purchase temp number
    const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;
    
    const purchaseResponse = await fetch(purchaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        PhoneNumber: tempNumber,
        VoiceUrl: `https://${BASE_URL}/functions/v1/voice-answer`,
        StatusCallback: `https://${BASE_URL}/functions/v1/voice-status`,
        VoiceMethod: 'POST',
        StatusCallbackMethod: 'POST'
      })
    });

    const purchaseData = await purchaseResponse.json();

    // Log port order
    const portOrderId = crypto.randomUUID();
    
    await supabase.from('analytics_events').insert({
      event_type: 'port_order_created',
      event_data: {
        port_order_id: portOrderId,
        phone_number: phoneNumber,
        temp_did: tempNumber,
        foc_date: focDate.toISOString(),
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    console.log('Port order created:', portOrderId);

    return new Response(JSON.stringify({
      success: true,
      portOrderId,
      phoneNumber,
      focDate: focDate.toISOString().split('T')[0],
      tempDid: tempNumber,
      tempDidSid: purchaseData.sid
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-twilio-create-port:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
