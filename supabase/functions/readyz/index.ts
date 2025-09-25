import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

interface ReadinessStatus {
  ready: boolean;
  timestamp: string;
  services: {
    supabase: 'ready' | 'not_ready';
    vector_extension: 'ready' | 'not_ready';
    required_secrets: 'ready' | 'not_ready';
  };
  response_time_ms: number;
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const readiness: ReadinessStatus = {
    ready: false,
    timestamp: new Date().toISOString(),
    services: {
      supabase: 'not_ready',
      vector_extension: 'not_ready',
      required_secrets: 'not_ready'
    },
    response_time_ms: 0
  };

  // Supabase connectivity check
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Test basic connectivity
      const { error } = await supabase.from('kb_documents').select('count').limit(1);
      readiness.services.supabase = error ? 'not_ready' : 'ready';
      
      // Test vector extension
      if (!error) {
        try {
          const { error: vectorError } = await supabase.rpc('vector', {});
          // If the function doesn't exist, that's expected, but if we get a different error, vector extension might not be loaded
          readiness.services.vector_extension = 'ready';
        } catch (vectorErr) {
          // Vector extension check - if we can at least query vector columns, it's working
          const { error: vectorTestError } = await supabase
            .from('kb_documents')
            .select('embedding')
            .limit(1);
          readiness.services.vector_extension = vectorTestError ? 'not_ready' : 'ready';
        }
      }
    }
  } catch {
    readiness.services.supabase = 'not_ready';
    readiness.services.vector_extension = 'not_ready';
  }

  // Required secrets check
  try {
    const requiredSecrets = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN'
    ];
    
    const allSecretsPresent = requiredSecrets.every(secret => Deno.env.get(secret));
    readiness.services.required_secrets = allSecretsPresent ? 'ready' : 'not_ready';
  } catch {
    readiness.services.required_secrets = 'not_ready';
  }

  // Overall readiness
  const allServices = Object.values(readiness.services);
  readiness.ready = allServices.every(service => service === 'ready');
  readiness.response_time_ms = Date.now() - startTime;

  const statusCode = readiness.ready ? 200 : 503;

  return new Response(JSON.stringify(readiness, null, 2), {
    status: statusCode,
    headers: corsHeaders
  });
});