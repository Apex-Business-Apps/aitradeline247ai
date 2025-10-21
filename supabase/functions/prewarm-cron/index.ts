/**
 * Pre-warm Cron Job
 * Triggered every 5 minutes by pg_cron
 * 
 * Hits critical endpoints to keep functions warm
 * and reduce cold starts
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Default endpoints to pre-warm
const DEFAULT_ENDPOINTS = [
  "/functions/v1/healthz",
  "/functions/v1/dashboard-summary",
  "/functions/v1/secure-analytics"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("Pre-warm cron job started");

  try {
    // Load prewarm config
    let endpoints = DEFAULT_ENDPOINTS;
    try {
      const configResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/public/config/prewarm.json`);
      if (configResponse.ok) {
        const config = await configResponse.json();
        endpoints = config.endpoints || DEFAULT_ENDPOINTS;
      }
    } catch (e) {
      console.log("Using default endpoints (config not found)");
    }

    // Warm up each endpoint
    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const fullUrl = `${SUPABASE_URL}${endpoint}`;
        const warmStart = Date.now();
        
        try {
          const response = await fetch(fullUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "x-prewarm": "true"
            },
            signal: AbortSignal.timeout(3000) // 3s timeout
          });

          const warmMs = Date.now() - warmStart;
          
          console.log(`Warmed ${endpoint}`, {
            status: response.status,
            warm_ms: warmMs,
            ok: response.ok
          });

          return {
            endpoint,
            status: response.status,
            warm_ms: warmMs,
            ok: response.ok
          };
        } catch (error: any) {
          console.warn(`Failed to warm ${endpoint}:`, error.message);
          return {
            endpoint,
            error: error.message,
            warm_ms: Date.now() - warmStart
          };
        }
      })
    );

    const totalMs = Date.now() - startTime;
    const summary = {
      timestamp: new Date().toISOString(),
      total_ms: totalMs,
      endpoints_warmed: endpoints.length,
      results: results.map(r => 
        r.status === 'fulfilled' ? r.value : { error: r.reason }
      )
    };

    console.log("Pre-warm completed", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error: any) {
    console.error("Pre-warm cron failed:", error.message);
    
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

