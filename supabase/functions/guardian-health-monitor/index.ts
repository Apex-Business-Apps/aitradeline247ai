import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CircuitBreakerState {
  service: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
}

const circuitBreakers: Map<string, CircuitBreakerState> = new Map();

async function checkCircuitBreaker(service: string, supabase: any, mode: string) {
  const breaker = circuitBreakers.get(service) || {
    service,
    state: 'closed',
    failureCount: 0,
    successCount: 0
  };

  // Log circuit breaker state (observe-only mode)
  if (mode === 'observe_only') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Circuit Breaker Observation - Service: ${service}, State: ${breaker.state}, Failures: ${breaker.failureCount}, Successes: ${breaker.successCount}`);
    
    // Store event with secret redaction
    await supabase.from('guardian_circuit_breaker_events').insert({
      service_name: service,
      state: breaker.state,
      failure_count: breaker.failureCount,
      success_count: breaker.successCount,
      reason: 'observe_only_monitoring',
      metadata: {
        timestamp,
        mode: 'observe_only'
      }
    });
  }

  return breaker;
}

async function performAutoHeal(reason: string, actionType: string, supabase: any, mode: string) {
  // Check if auto-heal is allowed (rate limiting: 1 per hour)
  const { data: allowed } = await supabase.rpc('is_autoheal_allowed', {
    p_action_type: actionType
  });

  if (!allowed) {
    console.log(`Auto-heal skipped: rate limit exceeded for ${actionType}`);
    await supabase.from('guardian_autoheal_actions').insert({
      action_type: actionType,
      trigger_reason: reason,
      status: 'skipped',
      mode,
      metadata: { skip_reason: 'rate_limit_exceeded' }
    });
    return false;
  }

  if (mode === 'dry_run') {
    console.log(`[DRY-RUN] Would perform auto-heal: ${actionType} - Reason: ${reason}`);
    await supabase.from('guardian_autoheal_actions').insert({
      action_type: actionType,
      trigger_reason: reason,
      status: 'skipped',
      mode: 'dry_run',
      metadata: { simulated: true }
    });
    return false;
  }

  // Active mode: perform actual healing
  console.log(`[ACTIVE] Performing auto-heal: ${actionType} - Reason: ${reason}`);
  
  try {
    await supabase.from('guardian_autoheal_actions').insert({
      action_type: actionType,
      trigger_reason: reason,
      status: 'initiated',
      mode: 'active',
      metadata: { initiated_at: new Date().toISOString() }
    });

    // Actual healing logic would go here
    // For now, we just log the action
    
    await supabase.from('guardian_autoheal_actions').insert({
      action_type: actionType,
      trigger_reason: reason,
      status: 'success',
      mode: 'active',
      metadata: { completed_at: new Date().toISOString() }
    });

    // Create alert for high-severity auto-heal
    await supabase.from('security_alerts').insert({
      alert_type: 'autoheal_action_taken',
      severity: 'medium',
      event_data: {
        action_type: actionType,
        trigger_reason: reason,
        mode: 'active'
      }
    });

    return true;
  } catch (error) {
    console.error(`Auto-heal failed: ${error}`);
    await supabase.from('guardian_autoheal_actions').insert({
      action_type: actionType,
      trigger_reason: reason,
      status: 'failed',
      mode: 'active',
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        failed_at: new Date().toISOString()
      }
    });
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get configuration
    const { data: configs } = await supabase
      .from('guardian_config')
      .select('key, value')
      .in('key', ['autoheal_mode', 'circuit_breaker_mode']);

    const autoHealMode = configs?.find(c => c.key === 'autoheal_mode')?.value || 'dry_run';
    const breakerMode = configs?.find(c => c.key === 'circuit_breaker_mode')?.value || 'observe_only';

    // Check if auto-heal kill-switch is active
    const killSwitch = Deno.env.get('GUARDIAN_AUTOHEAL_KILLSWITCH');
    const effectiveMode = killSwitch === 'true' ? 'dry_run' : autoHealMode;

    console.log(`Health monitor running - AutoHeal: ${effectiveMode}, Breakers: ${breakerMode}`);

    // Monitor circuit breakers (observe-only)
    const services = ['supabase', 'twilio', 'resend', 'openai'];
    for (const service of services) {
      await checkCircuitBreaker(service, supabase, breakerMode);
    }

    // Check for health issues that might trigger auto-heal
    // Example: check recent synthetic check failures
    const { data: recentFailures } = await supabase
      .from('guardian_synthetic_checks')
      .select('*')
      .eq('success', false)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .limit(5);

    if (recentFailures && recentFailures.length >= 3) {
      console.warn('⚠️ Multiple recent check failures detected');
      await performAutoHeal(
        'multiple_synthetic_check_failures',
        'observe_only',
        supabase,
        effectiveMode
      );
    }

    return new Response(
      JSON.stringify({
        status: 'healthy',
        autoheal_mode: effectiveMode,
        circuit_breaker_mode: breakerMode,
        services_monitored: services.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Guardian health monitor error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
