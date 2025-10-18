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

    const { tenant_id, test_sms = false, phone_number, test_destination } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    console.log('Messaging health check for tenant:', tenant_id);

    // Get all numbers for this tenant
    const { data: quickstartNumbers } = await supabase
      .from('twilio_quickstart_configs')
      .select('phone_number, subaccount_sid, messaging_service_sid, metadata')
      .eq('tenant_id', tenant_id);

    const { data: hostedSmsNumbers } = await supabase
      .from('twilio_hosted_sms_orders')
      .select('phone_number, subaccount_sid, status')
      .eq('tenant_id', tenant_id)
      .eq('status', 'approved');

    const { data: portedNumbers } = await supabase
      .from('twilio_port_orders')
      .select('phone_number, subaccount_sid, status, a2p_brand_sid, a2p_campaign_sid')
      .eq('tenant_id', tenant_id)
      .eq('status', 'completed');

    const allNumbers = [
      ...(quickstartNumbers || []).map(n => ({ 
        phone_number: n.phone_number, 
        subaccount_sid: n.subaccount_sid,
        messaging_service_sid: n.messaging_service_sid,
        source: 'quickstart'
      })),
      ...(hostedSmsNumbers || []).map(n => ({ 
        phone_number: n.phone_number, 
        subaccount_sid: n.subaccount_sid,
        source: 'hosted_sms'
      })),
      ...(portedNumbers || []).map(n => ({ 
        phone_number: n.phone_number, 
        subaccount_sid: n.subaccount_sid,
        a2p_brand_sid: n.a2p_brand_sid,
        a2p_campaign_sid: n.a2p_campaign_sid,
        source: 'ported'
      }))
    ];

    const healthChecks = [];

    for (const number of allNumbers) {
      const accountSid = number.subaccount_sid || TWILIO_ACCOUNT_SID;
      
      // Check if number is in a messaging service
      let messagingServiceStatus = 'not_configured';
      let messagingServiceSid = number.messaging_service_sid;

      if (!messagingServiceSid) {
        // Try to find messaging service for this number
        const servicesUrl = `https://messaging.twilio.com/v1/Services`;
        const servicesResponse = await fetch(servicesUrl, {
          headers: { 'Authorization': `Basic ${auth}` }
        });

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          for (const service of servicesData.services || []) {
            const phoneNumbersUrl = `https://messaging.twilio.com/v1/Services/${service.sid}/PhoneNumbers`;
            const phoneNumbersResponse = await fetch(phoneNumbersUrl, {
              headers: { 'Authorization': `Basic ${auth}` }
            });

            if (phoneNumbersResponse.ok) {
              const phoneNumbersData = await phoneNumbersResponse.json();
              const found = phoneNumbersData.phone_numbers?.find(
                (pn: any) => pn.phone_number === number.phone_number
              );
              if (found) {
                messagingServiceSid = service.sid;
                messagingServiceStatus = 'configured';
                break;
              }
            }
          }
        }
      } else {
        messagingServiceStatus = 'configured';
      }

      // Check A2P registration status
      let a2pStatus = 'not_registered';
      if (number.a2p_brand_sid && number.a2p_campaign_sid) {
        a2pStatus = 'registered';
      }

      // Get recent SMS delivery metrics
      const { data: recentSms } = await supabase
        .from('sms_status_logs')
        .select('created_at, status, error_code')
        .eq('from_e164', number.phone_number)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      const deliveryStats = {
        total: recentSms?.length || 0,
        delivered: recentSms?.filter(s => s.status === 'delivered').length || 0,
        failed: recentSms?.filter(s => s.status === 'failed').length || 0,
        pending: recentSms?.filter(s => s.status === 'sent' || s.status === 'queued').length || 0
      };

      const deliveryRate = deliveryStats.total > 0 
        ? (deliveryStats.delivered / deliveryStats.total * 100).toFixed(1) 
        : null;

      // Get recent errors
      const { data: recentErrors } = await supabase
        .from('sms_status_logs')
        .select('created_at, error_code, status')
        .eq('from_e164', number.phone_number)
        .not('error_code', 'is', null)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      healthChecks.push({
        phone_number: number.phone_number,
        source: number.source,
        messaging_service_status: messagingServiceStatus,
        messaging_service_sid: messagingServiceSid,
        a2p_status: a2pStatus,
        a2p_brand_sid: number.a2p_brand_sid || null,
        a2p_campaign_sid: number.a2p_campaign_sid || null,
        delivery_stats_24h: deliveryStats,
        delivery_rate_percent: deliveryRate,
        recent_errors: recentErrors || []
      });
    }

    // Send test SMS if requested
    let testSmsResult = null;
    if (test_sms && phone_number && test_destination) {
      const testNumber = allNumbers.find(n => n.phone_number === phone_number);
      if (testNumber) {
        const accountSid = testNumber.subaccount_sid || TWILIO_ACCOUNT_SID;
        const smsUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        
        const smsResponse = await fetch(smsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: phone_number,
            To: test_destination,
            Body: `[TEST] TradeLine 24/7 messaging health check at ${new Date().toLocaleString()}`
          })
        });

        if (smsResponse.ok) {
          const smsData = await smsResponse.json();
          testSmsResult = {
            success: true,
            message_sid: smsData.sid,
            status: smsData.status,
            message: 'Test SMS sent successfully'
          };

          // Log the test
          await supabase.from('analytics_events').insert({
            event_type: 'messaging_health_test_sms',
            event_data: {
              phone_number,
              message_sid: smsData.sid,
              tenant_id,
              test_destination
            },
            severity: 'info'
          });
        } else {
          const errorText = await smsResponse.text();
          testSmsResult = {
            success: false,
            error: errorText,
            message: 'Failed to send test SMS'
          };
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tenant_id,
      numbers_checked: healthChecks.length,
      health_checks: healthChecks,
      test_sms: testSmsResult,
      checked_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-messaging-health-check:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
