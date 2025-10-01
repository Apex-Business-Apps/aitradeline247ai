// Guardian Readiness Check - Dependency Health Probe
// Returns: {"ready": boolean, "checks": {...}, "timestamp": ISO8601}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheck {
  name: string;
  status: 'green' | 'yellow' | 'red';
  responseTime?: number;
  message?: string;
}

// Redact sensitive values from connection strings and keys
function redactSecret(value: string | undefined): string {
  if (!value) return '[not configured]';
  if (value.length < 8) return '[redacted]';
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'database',
        status: 'red',
        message: 'Missing configuration'
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Simple connectivity check
    const { error } = await supabase.from('guardian_config').select('key').limit(1);
    
    if (error) {
      return {
        name: 'database',
        status: 'red',
        responseTime: Date.now() - start,
        message: 'Connection failed'
      };
    }

    const responseTime = Date.now() - start;
    return {
      name: 'database',
      status: responseTime < 500 ? 'green' : 'yellow',
      responseTime,
      message: responseTime < 500 ? 'Healthy' : 'Slow response'
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'red',
      responseTime: Date.now() - start,
      message: 'Exception occurred'
    };
  }
}

async function checkConfig(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missing = requiredVars.filter(v => !Deno.env.get(v));
    
    if (missing.length > 0) {
      return {
        name: 'config',
        status: 'red',
        responseTime: Date.now() - start,
        message: `Missing: ${missing.join(', ')}`
      };
    }

    return {
      name: 'config',
      status: 'green',
      responseTime: Date.now() - start,
      message: 'All required variables present'
    };
  } catch (error) {
    return {
      name: 'config',
      status: 'red',
      responseTime: Date.now() - start,
      message: 'Configuration validation failed'
    };
  }
}

async function checkMemory(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const memUsage = Deno.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    let status: 'green' | 'yellow' | 'red' = 'green';
    let message = `${heapUsedMB.toFixed(0)}MB used`;

    if (usagePercent > 90) {
      status = 'red';
      message += ' (critical)';
    } else if (usagePercent > 75) {
      status = 'yellow';
      message += ' (elevated)';
    }

    return {
      name: 'memory',
      status,
      responseTime: Date.now() - start,
      message
    };
  } catch (error) {
    return {
      name: 'memory',
      status: 'yellow',
      responseTime: Date.now() - start,
      message: 'Metrics unavailable'
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [dbCheck, configCheck, memCheck] = await Promise.all([
      checkDatabase(),
      checkConfig(),
      checkMemory()
    ]);

    const checks: Record<string, HealthCheck> = {
      database: dbCheck,
      config: configCheck,
      memory: memCheck
    };

    // Determine overall readiness
    const hasRed = Object.values(checks).some(c => c.status === 'red');
    const hasYellow = Object.values(checks).some(c => c.status === 'yellow');

    const ready = !hasRed;
    const overallStatus = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

    const response = {
      ready,
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        status: ready ? 200 : 503
      }
    );
  } catch (error) {
    const errorResponse = {
      ready: false,
      status: 'red',
      checks: {
        system: {
          name: 'system',
          status: 'red' as const,
          message: 'Health check failed'
        }
      },
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        status: 503
      }
    );
  }
});
