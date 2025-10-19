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
      subaccount_sid 
    } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log hosted SMS request initiation
    const submissionId = crypto.randomUUID();
    
    await supabase.from('analytics_events').insert({
      event_type: 'hosted_sms_requested',
      event_data: {
        submission_id: submissionId,
        phone_number: phoneNumber,
        tenant_id,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    console.log('Initiating Hosted SMS order for:', phoneNumber);

    // Create Twilio Hosted Number Order
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const twilioApiUrl = subaccount_sid 
      ? `https://api.twilio.com/2010-04-01/Accounts/${subaccount_sid}/HostedNumber/HostedNumberOrders.json`
      : `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/HostedNumber/HostedNumberOrders.json`;

    const formData = new URLSearchParams();
    formData.append('PhoneNumber', phoneNumber);
    formData.append('ContactEmail', contact_email);
    formData.append('ContactPhoneNumber', phoneNumber);
    formData.append('AddressSid', ''); // Would need to create address resource first in production
    formData.append('Email', contact_email);
    formData.append('CcEmails[]', contact_email);
    formData.append('FriendlyName', `${business_name} - Hosted SMS`);

    const twilioResponse = await fetch(twilioApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio Hosted Number Order failed:', errorText);
      throw new Error(`Twilio API error: ${errorText}`);
    }

    const orderData = await twilioResponse.json();
    console.log('Hosted Number Order created:', orderData);

    // Store the order details
    await supabase.from('twilio_hosted_sms_orders').insert({
      tenant_id,
      phone_number: phoneNumber,
      order_sid: orderData.sid,
      status: orderData.status,
      contact_email,
      business_name,
      legal_address,
      subaccount_sid,
      order_data: orderData,
      submission_id: submissionId
    });

    // Log success
    await supabase.from('analytics_events').insert({
      event_type: 'hosted_sms_order_created',
      event_data: {
        submission_id: submissionId,
        order_sid: orderData.sid,
        phone_number: phoneNumber,
        status: orderData.status,
        tenant_id
      },
      severity: 'info'
    });

    return new Response(JSON.stringify({
      success: true,
      submissionId,
      orderSid: orderData.sid,
      phoneNumber,
      status: orderData.status,
      message: 'Hosted SMS order created. Client will receive LOA email at ' + contact_email,
      verificationUrl: orderData.verification_document_url,
      loaUrl: orderData.loa_document_url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-twilio-hosted-sms:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

