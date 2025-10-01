import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate 24-hour report
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    // Get metrics using the database function
    const { data: metrics } = await supabase.rpc('get_guardian_metrics', {
      p_start_time: startTime.toISOString(),
      p_end_time: endTime.toISOString()
    });

    if (!metrics) {
      throw new Error('Failed to retrieve metrics');
    }

    // Check for failure conditions
    const failureRate = 100 - metrics.synthetic_checks.success_rate;
    const shouldDisable = failureRate > 0.5;

    // Get recent auto-heal actions for runaway detection
    const { data: recentHeals } = await supabase
      .from('guardian_autoheal_actions')
      .select('*')
      .eq('mode', 'active')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    // Detect runaway healing (more than 5 heals in 24h)
    const runawayDetected = (recentHeals?.length || 0) > 5;

    // Auto-disable if thresholds exceeded
    if (shouldDisable || runawayDetected) {
      console.warn('⚠️ Guardian auto-disable triggered');
      
      // Disable synthetic checks
      await supabase
        .from('guardian_config')
        .update({ value: false, updated_at: new Date().toISOString() })
        .eq('key', 'synthetic_enabled');

      // Revert auto-heal to dry-run
      await supabase
        .from('guardian_config')
        .update({ value: 'dry_run', updated_at: new Date().toISOString() })
        .eq('key', 'autoheal_mode');

      // Create high-severity alert
      await supabase.from('security_alerts').insert({
        alert_type: 'guardian_auto_disabled',
        severity: 'critical',
        event_data: {
          reason: shouldDisable ? 'high_failure_rate' : 'runaway_healing',
          failure_rate: failureRate,
          heal_count: recentHeals?.length || 0,
          disabled_at: new Date().toISOString()
        }
      });
    }

    // Get circuit breaker events
    const { data: breakerEvents } = await supabase
      .from('guardian_circuit_breaker_events')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    const report = {
      report_type: '24h_canary',
      period: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      synthetic_checks: metrics.synthetic_checks,
      autoheal_actions: {
        total: metrics.autoheal_actions,
        recent: recentHeals || [],
        runaway_detected: runawayDetected
      },
      circuit_breaker_events: {
        total: metrics.breaker_transitions,
        recent: breakerEvents || []
      },
      auto_disable: {
        triggered: shouldDisable || runawayDetected,
        reason: shouldDisable ? 'high_failure_rate' : runawayDetected ? 'runaway_healing' : null,
        failure_rate: failureRate
      },
      status: shouldDisable || runawayDetected ? 'disabled' : 'active',
      generated_at: new Date().toISOString()
    };

    // Store report
    await supabase.from('analytics_events').insert({
      event_type: 'guardian_24h_report',
      event_data: report,
      severity: shouldDisable || runawayDetected ? 'critical' : 'info'
    });

    console.log('24h canary report generated:', {
      success_rate: metrics.synthetic_checks.success_rate,
      heals: metrics.autoheal_actions,
      auto_disabled: shouldDisable || runawayDetected
    });

    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Guardian report generator error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
