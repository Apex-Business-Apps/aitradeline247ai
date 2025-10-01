// Guardian Health Check - Liveness Probe
// Returns: {"status": "healthy" | "unhealthy", "timestamp": ISO8601}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Liveness check: Process is alive and responding
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };

    return new Response(
      JSON.stringify(health),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        status: 200
      }
    );
  } catch (error) {
    // Unhealthy: Process experiencing critical issues
    const unhealthy = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };

    return new Response(
      JSON.stringify(unhealthy),
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
