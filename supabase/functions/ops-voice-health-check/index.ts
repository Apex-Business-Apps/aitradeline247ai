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

    const { tenant_id, test_call = false, phone_number } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    console.log('Voice health check for tenant:', tenant_id);

    // Get all numbers for this tenant
    const { data: quickstartNumbers } = await supabase
      .from('twilio_quickstart_configs')
      .select('phone_number, subaccount_sid, metadata')
      .eq('tenant_id', tenant_id);

    const { data: portedNumbers } = await supabase
      .from('twilio_port_orders')
      .select('phone_number, subaccount_sid, status')
      .eq('tenant_id', tenant_id)
      .eq('status', 'completed');

    const allNumbers = [
      ...(quickstartNumbers || []).map(n => ({ 
        phone_number: n.phone_number, 
        subaccount_sid: n.subaccount_sid,
        source: 'quickstart'
      })),
      ...(portedNumbers || []).map(n => ({ 
        phone_number: n.phone_number, 
        subaccount_sid: n.subaccount_sid,
        source: 'ported'
      }))
    ];

    const healthChecks = [];

    for (const number of allNumbers) {
      const accountSid = number.subaccount_sid || TWILIO_ACCOUNT_SID;
      
      // Get number configuration
      const numbersUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(number.phone_number)}`;
      const numbersResponse = await fetch(numbersUrl, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      let webhookStatus = 'unknown';
      let voiceUrl = null;
      let statusCallback = null;

      if (numbersResponse.ok) {
        const numbersData = await numbersResponse.json();
        if (numbersData.incoming_phone_numbers && numbersData.incoming_phone_numbers.length > 0) {
          const numberConfig = numbersData.incoming_phone_numbers[0];
          voiceUrl = numberConfig.voice_url;
          statusCallback = numberConfig.status_callback_url;

          // Test webhook endpoint
          if (voiceUrl) {
            try {
              const webhookTest = await fetch(voiceUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  CallSid: 'CA_health_check_test',
                  From: '+15555551234',
                  To: number.phone_number,
                  CallStatus: 'ringing'
                })
              });
              webhookStatus = webhookTest.ok ? 'healthy' : 'error';
            } catch (error) {
              webhookStatus = 'unreachable';
              console.error('Webhook test failed:', error);
            }
          }
        }
      }

      // Get recent call metrics
      const { data: recentCalls } = await supabase
        .from('call_logs')
        .select('created_at, duration_sec, status')
        .eq('to_e164', number.phone_number)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate P95 latency (stream handshake time)
      const { data: streamLogs } = await supabase
        .from('voice_stream_logs')
        .select('handshake_ms')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .not('handshake_ms', 'is', null)
        .order('handshake_ms', { ascending: false });

      let p95Latency = null;
      if (streamLogs && streamLogs.length > 0) {
        const p95Index = Math.floor(streamLogs.length * 0.05);
        p95Latency = streamLogs[p95Index]?.handshake_ms;
      }

      // Get recent errors
      const { data: recentErrors } = await supabase
        .from('analytics_events')
        .select('created_at, event_type, event_data')
        .eq('severity', 'error')
        .or(`event_data->phone_number.eq.${number.phone_number}`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      healthChecks.push({
        phone_number: number.phone_number,
        source: number.source,
        webhook_status: webhookStatus,
        voice_url: voiceUrl,
        status_callback: statusCallback,
        recent_calls_24h: recentCalls?.length || 0,
        p95_latency_ms: p95Latency,
        recent_errors: recentErrors || [],
        last_call: recentCalls?.[0]?.created_at || null
      });
    }

    // Initiate test call if requested
    let testCallResult = null;
    if (test_call && phone_number) {
      const testNumber = quickstartNumbers?.find(n => n.phone_number === phone_number);
      if (testNumber) {
        const accountSid = testNumber.subaccount_sid || TWILIO_ACCOUNT_SID;
        const callUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
        
        const callResponse = await fetch(callUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: phone_number,
            To: phone_number, // Call self for testing
            Url: `https://api.tradeline247ai.com/voice/answer`,
            StatusCallback: `https://api.tradeline247ai.com/voice/status`
          })
        });

        if (callResponse.ok) {
          const callData = await callResponse.json();
          testCallResult = {
            success: true,
            call_sid: callData.sid,
            status: callData.status,
            message: 'Test call initiated successfully'
          };

          // Log the test
          await supabase.from('analytics_events').insert({
            event_type: 'voice_health_test_call',
            event_data: {
              phone_number,
              call_sid: callData.sid,
              tenant_id
            },
            severity: 'info'
          });
        } else {
          const errorText = await callResponse.text();
          testCallResult = {
            success: false,
            error: errorText,
            message: 'Failed to initiate test call'
          };
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tenant_id,
      numbers_checked: healthChecks.length,
      health_checks: healthChecks,
      test_call: testCallResult,
      checked_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-voice-health-check:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
