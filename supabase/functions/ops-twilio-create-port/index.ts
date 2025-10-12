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
      phoneNumber,
      tenant_id,
      business_name,
      legal_address,
      contact_email,
      subaccount_sid,
      authorized_person_name,
      current_carrier,
      bill_upload_url,
      fallback_e164
    } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Initiating port order for:', phoneNumber);

    // Create port order via Twilio Porting API (Public Beta)
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const twilioApiUrl = `https://numbers.twilio.com/v1/PortingPortIns`;

    const portRequest = {
      PhoneNumbers: [phoneNumber],
      NotificationEmails: [contact_email],
      TargetAccountSid: subaccount_sid || TWILIO_ACCOUNT_SID
    };

    const twilioResponse = await fetch(twilioApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(portRequest),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio Port Order creation failed:', errorText);
      throw new Error(`Twilio Porting API error: ${errorText}`);
    }

    const portData = await twilioResponse.json();
    console.log('Port Order created:', portData);

    // Estimate FOC date (typically 7-10 business days)
    const focDate = new Date();
    focDate.setDate(focDate.getDate() + 10);

    // Store port order details
    const { data: portOrder, error: insertError } = await supabase
      .from('twilio_port_orders')
      .insert({
        tenant_id,
        phone_number: phoneNumber,
        port_order_sid: portData.port_in_request_sid || portData.sid,
        status: 'pending-loa',
        authorized_person: authorized_person_name,
        current_carrier,
        contact_email,
        business_name,
        legal_address,
        subaccount_sid,
        bill_upload_url,
        fallback_e164,
        estimated_foc_date: focDate.toISOString(),
        port_data: portData
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Check if Quick-Start already exists for this tenant
    const { data: existingQuickStart } = await supabase
      .from('twilio_quickstart_configs')
      .select('*')
      .eq('tenant_id', tenant_id)
      .single();

    let temporaryDid = null;
    let quickStartNeeded = !existingQuickStart;

    // If no Quick-Start exists, trigger it now for temporary forwarding
    if (quickStartNeeded && fallback_e164) {
      console.log('No Quick-Start found, creating temporary forwarding...');
      
      const { data: quickStartData, error: quickStartError } = await supabase.functions.invoke(
        'ops-twilio-quickstart-forward',
        {
          body: {
            tenant_id,
            business_name,
            fallback_e164,
            area_code: phoneNumber.substring(2, 5),
            contact_email,
            for_port_temporary: true
          }
        }
      );

      if (!quickStartError && quickStartData) {
        temporaryDid = quickStartData.phone_number;
      }
    } else if (existingQuickStart) {
      temporaryDid = existingQuickStart.phone_number;
    }

    // Update port order with temporary DID info
    if (temporaryDid) {
      await supabase
        .from('twilio_port_orders')
        .update({ 
          temporary_did: temporaryDid,
          temporary_forwarding_active: true
        })
        .eq('id', portOrder.id);
    }

    // Pre-provision webhooks for the ported number (will activate on port completion)
    const baseUrl = 'https://api.tradeline247ai.com';
    const webhookConfig = {
      voice_url: `${baseUrl}/voice/answer`,
      status_callback: `${baseUrl}/voice/status`,
      voice_fallback_url: fallback_e164 ? `twiml://fallback-to-${fallback_e164}` : undefined
    };

    await supabase
      .from('twilio_port_orders')
      .update({ 
        webhook_config: webhookConfig,
        pre_provisioned: true
      })
      .eq('id', portOrder.id);

    // Log analytics event
    await supabase.from('analytics_events').insert({
      event_type: 'port_order_created',
      event_data: {
        port_order_sid: portOrder.port_order_sid,
        phone_number: phoneNumber,
        tenant_id,
        estimated_foc: focDate.toISOString(),
        temporary_did: temporaryDid,
        quickstart_created: quickStartNeeded
      },
      severity: 'info'
    });

    return new Response(JSON.stringify({
      success: true,
      portOrderSid: portOrder.port_order_sid,
      portOrderId: portOrder.id,
      phoneNumber,
      status: 'pending-loa',
      estimatedFocDate: focDate.toISOString(),
      temporaryDid,
      quickStartCreated: quickStartNeeded,
      loaRequired: true,
      message: 'Port order created. Client will receive LOA email for signature.',
      nextSteps: [
        'Client must sign LOA electronically',
        temporaryDid ? `Temporary forwarding active via ${temporaryDid}` : 'Set up call forwarding to temporary number',
        'Monitor port status for FOC date',
        'Test number after port completion'
      ]
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
