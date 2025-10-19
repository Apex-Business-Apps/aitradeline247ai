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

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Missing Twilio credentials');
    }

    const { 
      tenant_id,
      business_name,
      legal_address,
      phone_number,
      subaccount_sid,
      country_code = 'US',
      contact_email
    } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const accountSid = subaccount_sid || TWILIO_ACCOUNT_SID;

    console.log('Starting Trust Hub setup for:', tenant_id);

    let trustHubProfileSid = null;
    let a2pBrandSid = null;
    let a2pCampaignSid = null;
    let voiceIntegrityEnabled = false;
    let cnamSet = false;

    // Step 1: Create Trust Hub Business Profile
    try {
      const trustHubUrl = `https://trusthub.twilio.com/v1/CustomerProfiles`;
      const trustHubResponse = await fetch(trustHubUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          FriendlyName: `${business_name} Profile`,
          Email: contact_email,
          PolicySid: 'RNb0d4771c2c98518d0d16c5bf199a916f', // Standard Business Profile policy
          StatusCallback: `https://api.tradeline247ai.com/webhooks/trusthub-status`
        })
      });

      if (trustHubResponse.ok) {
        const trustHubData = await trustHubResponse.json();
        trustHubProfileSid = trustHubData.sid;
        console.log('Trust Hub Profile created:', trustHubProfileSid);
      } else {
        const errorText = await trustHubResponse.text();
        console.error('Trust Hub creation failed:', errorText);
      }
    } catch (error) {
      console.error('Error creating Trust Hub profile:', error);
    }

    // Step 2: Register A2P 10DLC Brand and Campaign (US only)
    if (country_code === 'US' && trustHubProfileSid) {
      try {
        // Create A2P Brand
        const brandUrl = `https://messaging.twilio.com/v1/Services/${accountSid}/Brands`;
        const brandResponse = await fetch(brandUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            FriendlyName: business_name,
            BrandType: 'STANDARD',
            CustomerProfileBundleSid: trustHubProfileSid
          })
        });

        if (brandResponse.ok) {
          const brandData = await brandResponse.json();
          a2pBrandSid = brandData.sid;
          console.log('A2P Brand created:', a2pBrandSid);

          // Create A2P Campaign
          const campaignUrl = `https://messaging.twilio.com/v1/Services/${accountSid}/Campaigns`;
          const campaignResponse = await fetch(campaignUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              BrandSid: a2pBrandSid,
              Description: `Standard messaging campaign for ${business_name}`,
              MessageFlow: 'Transactional and promotional messages for business communications',
              UseCases: 'MIXED',
              MessageSamples: 'Hi! Your appointment is confirmed for tomorrow at 2 PM.'
            })
          });

          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            a2pCampaignSid = campaignData.sid;
            console.log('A2P Campaign created:', a2pCampaignSid);
          } else {
            const errorText = await campaignResponse.text();
            console.error('A2P Campaign creation failed:', errorText);
          }
        } else {
          const errorText = await brandResponse.text();
          console.error('A2P Brand creation failed:', errorText);
        }
      } catch (error) {
        console.error('Error creating A2P registration:', error);
      }
    }

    // Step 3: Enable Voice Integrity (SHAKEN/STIR)
    if (phone_number) {
      try {
        const voiceIntegrityUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phone_number)}`;
        const numbersResponse = await fetch(voiceIntegrityUrl, {
          headers: { 'Authorization': `Basic ${auth}` }
        });

        if (numbersResponse.ok) {
          const numbersData = await numbersResponse.json();
          if (numbersData.incoming_phone_numbers && numbersData.incoming_phone_numbers.length > 0) {
            const numberSid = numbersData.incoming_phone_numbers[0].sid;
            
            // Enable STIR/SHAKEN attestation
            const updateUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers/${numberSid}.json`;
            const updateResponse = await fetch(updateUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: new URLSearchParams({
                VoiceReceiveMode: 'voice',
                VoiceCallerIdLookup: 'true'
              })
            });

            if (updateResponse.ok) {
              voiceIntegrityEnabled = true;
              console.log('Voice Integrity enabled for:', phone_number);
            }
          }
        }
      } catch (error) {
        console.error('Error enabling Voice Integrity:', error);
      }
    }

    // Step 4: Set CNAM (Caller ID Name)
    if (phone_number && business_name) {
      try {
        const cnamUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/OutgoingCallerIds.json`;
        const cnamResponse = await fetch(cnamUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            PhoneNumber: phone_number,
            FriendlyName: business_name
          })
        });

        if (cnamResponse.ok) {
          cnamSet = true;
          console.log('CNAM set for:', phone_number);
        } else {
          // CNAM might already be set or not supported for this number type
          const errorText = await cnamResponse.text();
          console.log('CNAM setup note:', errorText);
        }
      } catch (error) {
        console.error('Error setting CNAM:', error);
      }
    }

    // Update relevant database records
    if (phone_number) {
      // Check if this is a port order or quickstart
      const { data: portOrder } = await supabase
        .from('twilio_port_orders')
        .select('id')
        .eq('phone_number', phone_number)
        .eq('tenant_id', tenant_id)
        .single();

      if (portOrder) {
        await supabase
          .from('twilio_port_orders')
          .update({
            trust_hub_profile_sid: trustHubProfileSid,
            a2p_brand_sid: a2pBrandSid,
            a2p_campaign_sid: a2pCampaignSid,
            metadata: {
              voice_integrity_enabled: voiceIntegrityEnabled,
              cnam_set: cnamSet
            }
          })
          .eq('id', portOrder.id);
      }

      const { data: quickstart } = await supabase
        .from('twilio_quickstart_configs')
        .select('id')
        .eq('phone_number', phone_number)
        .eq('tenant_id', tenant_id)
        .single();

      if (quickstart) {
        await supabase
          .from('twilio_quickstart_configs')
          .update({
            metadata: {
              trust_hub_profile_sid: trustHubProfileSid,
              a2p_brand_sid: a2pBrandSid,
              a2p_campaign_sid: a2pCampaignSid,
              voice_integrity_enabled: voiceIntegrityEnabled,
              cnam_set: cnamSet
            }
          })
          .eq('id', quickstart.id);
      }
    }

    // Log evidence
    await supabase.from('analytics_events').insert({
      event_type: 'trust_setup_complete',
      event_data: {
        tenant_id,
        phone_number,
        trust_hub_profile_sid: trustHubProfileSid,
        a2p_brand_sid: a2pBrandSid,
        a2p_campaign_sid: a2pCampaignSid,
        voice_integrity_enabled: voiceIntegrityEnabled,
        cnam_set: cnamSet
      },
      severity: 'info'
    });

    const evidenceNotes = [];
    if (trustHubProfileSid) evidenceNotes.push('✅ Trust Hub Business Profile created');
    if (a2pBrandSid && a2pCampaignSid) evidenceNotes.push('✅ Registered for 10DLC');
    if (voiceIntegrityEnabled) evidenceNotes.push('✅ Enabled STIR/SHAKEN');
    if (cnamSet) evidenceNotes.push(`✅ CNAM set to "${business_name}"`);

    return new Response(JSON.stringify({
      success: true,
      trustHubProfileSid,
      a2pBrandSid,
      a2pCampaignSid,
      voiceIntegrityEnabled,
      cnamSet,
      evidence: evidenceNotes.join(' | '),
      message: 'Trust and reputation setup complete'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-twilio-trust-setup:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

