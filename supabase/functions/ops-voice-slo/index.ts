import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    // Get calls from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: calls } = await supabase
      .from('call_logs')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (!calls || calls.length === 0) {
      return new Response(JSON.stringify({
        slos: {
          p95_ring_seconds: 0,
          handoff_rate: 0,
          amd_rate: 0,
          consent_decline_rate: 0,
          llm_stream_error_rate: 0,
          transcript_latency_p95: 0,
        },
        thresholds: {
          p95_ring_seconds: 20,
          handoff_rate_min: 20,
          handoff_rate_max: 60,
          llm_stream_error_rate: 1,
          transcript_latency_p95: 120,
        },
        metrics: {
          total_calls: 0,
          llm_calls: 0,
          bridge_calls: 0,
          handoffs: 0,
          amd_detected: 0,
          consent_declined: 0,
          llm_errors: 0,
        },
        alerts: [],
        window_hours: 24,
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate metrics
    const totalCalls = calls.length;
    const llmCalls = calls.filter(c => c.mode === 'llm').length;
    const bridgeCalls = calls.filter(c => c.mode === 'bridge').length;
    const handoffs = calls.filter(c => c.handoff === true).length;
    const amdDetected = calls.filter(c => c.amd_detected === true).length;
    const consentDeclined = calls.filter(c => c.consent_given === false).length;
    const llmErrors = calls.filter(c => c.fail_path?.includes('llm') || c.fail_path?.includes('stream')).length;

    // Calculate p95 ring seconds
    const ringSortedCalls = calls
      .filter(c => c.ring_seconds != null)
      .map(c => c.ring_seconds)
      .sort((a, b) => a - b);
    const p95Index = Math.ceil(ringSortedCalls.length * 0.95) - 1;
    const p95RingSeconds = ringSortedCalls[p95Index] || 0;

    // Calculate rates
    const handoffRate = totalCalls > 0 ? (handoffs / totalCalls) * 100 : 0;
    const amdRate = totalCalls > 0 ? (amdDetected / totalCalls) * 100 : 0;
    const consentDeclineRate = totalCalls > 0 ? (consentDeclined / totalCalls) * 100 : 0;
    const llmStreamErrorRate = llmCalls > 0 ? (llmErrors / llmCalls) * 100 : 0;

    // Calculate transcript latency p95 (time from call end to transcript creation)
    const transcriptLatencies = calls
      .filter(c => c.ended_at && c.transcript && c.updated_at)
      .map(c => {
        const endTime = new Date(c.ended_at).getTime();
        const updateTime = new Date(c.updated_at).getTime();
        return (updateTime - endTime) / 1000; // seconds
      })
      .sort((a, b) => a - b);
    const transcriptP95Index = Math.ceil(transcriptLatencies.length * 0.95) - 1;
    const transcriptLatencyP95 = transcriptLatencies[transcriptP95Index] || 0;

    // Define thresholds
    const thresholds = {
      p95_ring_seconds: 20,
      handoff_rate_min: 20,
      handoff_rate_max: 60,
      llm_stream_error_rate: 1,
      transcript_latency_p95: 120,
    };

    // Check for threshold breaches
    const alerts = [];
    if (p95RingSeconds > thresholds.p95_ring_seconds) {
      alerts.push({
        metric: 'p95_ring_seconds',
        value: p95RingSeconds,
        threshold: thresholds.p95_ring_seconds,
        severity: 'warning',
        message: `P95 ring seconds (${p95RingSeconds}s) exceeds threshold (${thresholds.p95_ring_seconds}s)`,
      });
    }
    if (handoffRate < thresholds.handoff_rate_min || handoffRate > thresholds.handoff_rate_max) {
      alerts.push({
        metric: 'handoff_rate',
        value: handoffRate,
        threshold: `${thresholds.handoff_rate_min}-${thresholds.handoff_rate_max}%`,
        severity: 'warning',
        message: `Handoff rate (${handoffRate.toFixed(1)}%) outside expected range`,
      });
    }
    if (llmStreamErrorRate > thresholds.llm_stream_error_rate) {
      alerts.push({
        metric: 'llm_stream_error_rate',
        value: llmStreamErrorRate,
        threshold: thresholds.llm_stream_error_rate,
        severity: 'critical',
        message: `LLM stream error rate (${llmStreamErrorRate.toFixed(1)}%) exceeds threshold (${thresholds.llm_stream_error_rate}%)`,
      });
    }
    if (transcriptLatencyP95 > thresholds.transcript_latency_p95) {
      alerts.push({
        metric: 'transcript_latency_p95',
        value: transcriptLatencyP95,
        threshold: thresholds.transcript_latency_p95,
        severity: 'warning',
        message: `P95 transcript latency (${transcriptLatencyP95.toFixed(1)}s) exceeds threshold (${thresholds.transcript_latency_p95}s)`,
      });
    }

    const response = {
      slos: {
        p95_ring_seconds: parseFloat(p95RingSeconds.toFixed(2)),
        handoff_rate: parseFloat(handoffRate.toFixed(2)),
        amd_rate: parseFloat(amdRate.toFixed(2)),
        consent_decline_rate: parseFloat(consentDeclineRate.toFixed(2)),
        llm_stream_error_rate: parseFloat(llmStreamErrorRate.toFixed(2)),
        transcript_latency_p95: parseFloat(transcriptLatencyP95.toFixed(2)),
      },
      thresholds,
      metrics: {
        total_calls: totalCalls,
        llm_calls: llmCalls,
        bridge_calls: bridgeCalls,
        handoffs,
        amd_detected: amdDetected,
        consent_declined: consentDeclined,
        llm_errors: llmErrors,
      },
      alerts,
      window_hours: 24,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('SLO metrics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
