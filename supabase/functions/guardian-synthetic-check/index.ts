import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckTarget {
  id: string;
  url: string;
  method: string;
  timeout: number;
  expectedStatus: number[];
  validations?: {
    sslValid?: boolean;
    contentType?: string;
    jsonFields?: string[];
    domElements?: string[];
  };
}

const TARGETS: CheckTarget[] = [
  {
    id: 'apex_domain',
    url: 'https://555a4971-4138-435e-a7ee-dfa3d713d1d3.lovableproject.com',
    method: 'GET',
    timeout: 5000,
    expectedStatus: [200],
    validations: { sslValid: true }
  },
  {
    id: 'health_endpoint',
    url: 'https://555a4971-4138-435e-a7ee-dfa3d713d1d3.lovableproject.com/healthz',
    method: 'GET',
    timeout: 3000,
    expectedStatus: [200],
    validations: { jsonFields: ['status'] }
  },
  {
    id: 'readiness_endpoint',
    url: 'https://555a4971-4138-435e-a7ee-dfa3d713d1d3.lovableproject.com/readyz',
    method: 'GET',
    timeout: 3000,
    expectedStatus: [200],
    validations: { jsonFields: ['ready'] }
  },
  {
    id: 'static_asset',
    url: 'https://555a4971-4138-435e-a7ee-dfa3d713d1d3.lovableproject.com/assets/official-logo.svg',
    method: 'GET',
    timeout: 3000,
    expectedStatus: [200],
    validations: { contentType: 'image/svg+xml' }
  },
  {
    id: 'homepage',
    url: 'https://555a4971-4138-435e-a7ee-dfa3d713d1d3.lovableproject.com/',
    method: 'GET',
    timeout: 5000,
    expectedStatus: [200],
    validations: { domElements: ['#root'] }
  }
];

async function performCheck(target: CheckTarget, runId: string, supabase: any) {
  const startTime = Date.now();
  let success = false;
  let statusCode: number | null = null;
  let errorMessage: string | null = null;
  const validationResults: Record<string, any> = {};

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), target.timeout);

    const response = await fetch(target.url, {
      method: target.method,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    statusCode = response.status;
    const responseTime = Date.now() - startTime;

    // Check expected status
    if (!target.expectedStatus.includes(statusCode)) {
      throw new Error(`Unexpected status ${statusCode}, expected ${target.expectedStatus.join(' or ')}`);
    }

    // Perform validations
    if (target.validations) {
      if (target.validations.sslValid !== undefined) {
        validationResults.ssl_valid = target.url.startsWith('https://');
      }

      if (target.validations.contentType) {
        const contentType = response.headers.get('content-type') || '';
        validationResults.content_type_match = contentType.includes(target.validations.contentType);
        if (!validationResults.content_type_match) {
          throw new Error(`Content-Type mismatch: expected ${target.validations.contentType}, got ${contentType}`);
        }
      }

      if (target.validations.jsonFields) {
        const json = await response.json();
        validationResults.json_fields_present = target.validations.jsonFields.every(field => field in json);
        if (!validationResults.json_fields_present) {
          throw new Error(`Missing required JSON fields: ${target.validations.jsonFields.join(', ')}`);
        }
      }

      if (target.validations.domElements) {
        const html = await response.text();
        validationResults.dom_elements_present = target.validations.domElements.every(selector => 
          html.includes(selector)
        );
        if (!validationResults.dom_elements_present) {
          throw new Error(`Missing required DOM elements: ${target.validations.domElements.join(', ')}`);
        }
      }
    }

    success = true;

    // Store result
    await supabase.from('guardian_synthetic_checks').insert({
      check_run_id: runId,
      target_id: target.id,
      target_url: target.url,
      check_type: target.method,
      status_code: statusCode,
      response_time_ms: responseTime,
      success: true,
      validation_results: validationResults
    });

    console.log(`✅ Check ${target.id} passed (${responseTime}ms)`);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase.from('guardian_synthetic_checks').insert({
      check_run_id: runId,
      target_id: target.id,
      target_url: target.url,
      check_type: target.method,
      status_code: statusCode,
      response_time_ms: responseTime,
      success: false,
      error_message: errorMessage,
      validation_results: validationResults
    });

    console.error(`❌ Check ${target.id} failed: ${errorMessage}`);
  }

  return success;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if synthetic checks are enabled
    const { data: config } = await supabase
      .from('guardian_config')
      .select('value')
      .eq('key', 'synthetic_enabled')
      .single();

    if (!config?.value) {
      console.log('Synthetic checks are disabled');
      return new Response(
        JSON.stringify({ message: 'Synthetic checks are disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to acquire distributed lock
    const workerId = crypto.randomUUID();
    const lockKey = 'synthetic_check_runner';
    
    const { data: lockAcquired } = await supabase.rpc('acquire_guardian_lock', {
      p_lock_key: lockKey,
      p_worker_id: workerId,
      p_ttl_seconds: 600
    });

    if (!lockAcquired) {
      console.log('Another check is already running, skipping...');
      return new Response(
        JSON.stringify({ message: 'Check already in progress' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    try {
      const runId = crypto.randomUUID();
      console.log(`Starting synthetic check run: ${runId}`);

      // Perform all checks
      const results = await Promise.all(
        TARGETS.map(target => performCheck(target, runId, supabase))
      );

      const allSuccess = results.every(r => r);

      // If any check failed, disable synthetic checks
      if (!allSuccess) {
        console.warn('⚠️ One or more checks failed, disabling synthetic checks');
        await supabase
          .from('guardian_config')
          .update({ value: false, updated_at: new Date().toISOString() })
          .eq('key', 'synthetic_enabled');

        // Create alert
        await supabase.from('security_alerts').insert({
          alert_type: 'synthetic_check_failure',
          severity: 'high',
          event_data: {
            run_id: runId,
            failed_targets: TARGETS.filter((_, i) => !results[i]).map(t => t.id),
            auto_disabled: true
          }
        });
      }

      return new Response(
        JSON.stringify({
          run_id: runId,
          success: allSuccess,
          checks_passed: results.filter(r => r).length,
          checks_total: results.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } finally {
      // Release lock
      await supabase.rpc('release_guardian_lock', {
        p_lock_key: lockKey,
        p_worker_id: workerId
      });
    }

  } catch (error) {
    console.error('Guardian synthetic check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
