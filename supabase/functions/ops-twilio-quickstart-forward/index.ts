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
    const apiBaseUrl = 'https://api.tradeline247ai.com';

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Missing Twilio credentials');
    }

    const { tenant_id, business_name, fallback_e164, area_code, contact_email } = await req.json();
    
    if (!tenant_id || !business_name || !fallback_e164) {
      throw new Error('Missing required fields');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    // Get subaccount SID
    const { data: subaccountData } = await supabase
      .from('twilio_subaccounts')
      .select('subaccount_sid')
      .eq('tenant_id', tenant_id)
      .single();

    const accountSid = subaccountData?.subaccount_sid || TWILIO_ACCOUNT_SID;

    console.log('Step 1: Searching for available number...');
    
    // Search for available number
    const searchResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/CA/Local.json?AreaCode=${area_code}&Limit=1`,
      {
        headers: { 'Authorization': `Basic ${authHeader}` }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Failed to search numbers: ${await searchResponse.text()}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.available_phone_numbers || searchData.available_phone_numbers.length === 0) {
      throw new Error(`No numbers available in area code ${area_code}`);
    }

    const phoneNumber = searchData.available_phone_numbers[0].phone_number;
    console.log('Found available number:', phoneNumber);

    // Step 2: Purchase the number
    console.log('Step 2: Purchasing number...');
    const purchaseResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          PhoneNumber: phoneNumber,
          FriendlyName: `${business_name} - TL247`,
          VoiceUrl: `${apiBaseUrl}/voice/answer`,
          VoiceMethod: 'POST',
          StatusCallback: `${apiBaseUrl}/voice/status`,
          StatusCallbackMethod: 'POST',
          VoiceFallbackMethod: 'GET'
        })
      }
    );

    if (!purchaseResponse.ok) {
      throw new Error(`Failed to purchase: ${await purchaseResponse.text()}`);
    }

    const purchasedNumber = await purchaseResponse.json();
    const phoneSid = purchasedNumber.sid;
    console.log('Number purchased:', phoneSid);

    // Step 3: Create TwiML Bin for failover
    console.log('Step 3: Creating failover TwiML Bin...');
    const twimlBinResponse = await fetch(
      `https://studio.twilio.com/v2/Services`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          FriendlyName: `${business_name} Failover`,
          Definition: JSON.stringify({
            description: 'Failover to client number',
            states: [{
              name: 'trigger',
              type: 'trigger',
              transitions: [{ event: 'incomingCall', next: 'dial_client' }]
            }, {
              name: 'dial_client',
              type: 'make-outgoing-call-v2',
              parameters: [{
                key: 'to',
                value: fallback_e164
              }]
            }]
          })
        })
      }
    );

    let failoverUrl = `${apiBaseUrl}/voice/answer`;
    if (twimlBinResponse.ok) {
      const twimlBin = await twimlBinResponse.json();
      failoverUrl = `https://webhooks.twilio.com/v1/Accounts/${accountSid}/Flows/${twimlBin.sid}`;
      console.log('Created TwiML Bin:', twimlBin.sid);
    }

    // Update number with failover
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers/${phoneSid}.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          VoiceFallbackUrl: failoverUrl
        })
      }
    );

    // Step 4: Add to Messaging Service
    console.log('Step 4: Adding to Messaging Service...');
    const { data: messagingData } = await supabase
      .from('twilio_messaging_services')
      .select('messaging_service_sid')
      .eq('tenant_id', tenant_id)
      .single();

    if (messagingData?.messaging_service_sid) {
      await fetch(
        `https://messaging.twilio.com/v1/Services/${messagingData.messaging_service_sid}/PhoneNumbers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            PhoneNumberSid: phoneSid
          })
        }
      );
      console.log('Added to Messaging Service');
    }

    // Step 5: Generate Forwarding Kit
    console.log('Step 5: Generating Forwarding Kit...');
    const forwardingKitResponse = await supabase.functions.invoke(
      'ops-generate-forwarding-kit',
      {
        body: {
          tenant_id,
          business_name,
          phone_number: phoneNumber,
          fallback_e164,
          contact_email
        }
      }
    );

    let forwardingKitUrl = '';
    if (forwardingKitResponse.data?.url) {
      forwardingKitUrl = forwardingKitResponse.data.url;
    }

    // Step 6: Store configuration
    await supabase.from('twilio_quickstart_configs').insert({
      tenant_id,
      phone_sid: phoneSid,
      phone_number: phoneNumber,
      fallback_e164,
      voice_url: `${apiBaseUrl}/voice/answer`,
      status_callback: `${apiBaseUrl}/voice/status`,
      failover_url: failoverUrl,
      messaging_service_enrolled: !!messagingData?.messaging_service_sid,
      forwarding_kit_url: forwardingKitUrl,
      status: 'active',
      metadata: {
        business_name,
        area_code,
        contact_email,
        created_at: new Date().toISOString()
      }
    });

    // Log analytics event
    await supabase.from('analytics_events').insert({
      event_type: 'quickstart_forward_complete',
      event_data: {
        tenant_id,
        phone_number: phoneNumber,
        business_name,
        forwarding_kit_generated: !!forwardingKitUrl
      },
      severity: 'info'
    });

    console.log('Quick-Start Forward complete!');

    return new Response(JSON.stringify({
      success: true,
      phone_number: phoneNumber,
      phone_sid: phoneSid,
      voice_url: `${apiBaseUrl}/voice/answer`,
      status_callback: `${apiBaseUrl}/voice/status`,
      failover_url: failoverUrl,
      messaging_enrolled: !!messagingData?.messaging_service_sid,
      forwarding_kit_url: forwardingKitUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-twilio-quickstart-forward:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

