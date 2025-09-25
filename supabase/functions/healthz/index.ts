import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'pass' | 'fail';
    openai: 'pass' | 'fail';
    twilio: 'pass' | 'fail';
  };
  response_time_ms: number;
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'fail',
      openai: 'fail',
      twilio: 'fail'
    },
    response_time_ms: 0
  };

  // Database health check
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error } = await supabase.from('kb_documents').select('count').limit(1);
      health.checks.database = error ? 'fail' : 'pass';
    }
  } catch {
    health.checks.database = 'fail';
  }

  // OpenAI API health check
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${openaiApiKey}` },
        signal: AbortSignal.timeout(5000)
      });
      health.checks.openai = response.ok ? 'pass' : 'fail';
    }
  } catch {
    health.checks.openai = 'fail';
  }

  // Twilio credentials check
  try {
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    health.checks.twilio = (twilioAccountSid && twilioAuthToken) ? 'pass' : 'fail';
  } catch {
    health.checks.twilio = 'fail';
  }

  // Overall health status
  const allChecks = Object.values(health.checks);
  health.status = allChecks.every(check => check === 'pass') ? 'healthy' : 'unhealthy';
  health.response_time_ms = Date.now() - startTime;

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return new Response(JSON.stringify(health, null, 2), {
    status: statusCode,
    headers: corsHeaders
  });
});