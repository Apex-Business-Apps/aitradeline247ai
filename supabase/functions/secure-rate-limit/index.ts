import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  identifier: string; // IP address or user ID
  endpoint: string;
  maxRequests?: number;
  windowMinutes?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { identifier, endpoint, maxRequests = 10, windowMinutes = 60 }: RateLimitRequest = await req.json();

    if (!identifier || !endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing identifier or endpoint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    // Check current request count in the window
    const { data: existingLimits, error: selectError } = await supabase
      .from('rate_limits')
      .select('request_count')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString());

    if (selectError) {
      console.error('Rate limit check error:', selectError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalRequests = existingLimits?.reduce((sum, limit) => sum + limit.request_count, 0) || 0;

    if (totalRequests >= maxRequests) {
      // Rate limit exceeded
      console.log(`Rate limit exceeded for ${identifier} on ${endpoint}: ${totalRequests}/${maxRequests}`);
      
      // Log the rate limit event
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'rate_limit_exceeded',
          event_data: {
            identifier,
            endpoint,
            current_requests: totalRequests,
            max_requests: maxRequests,
            window_minutes: windowMinutes
          },
          severity: 'warning'
        });

      return new Response(
        JSON.stringify({ 
          allowed: false, 
          message: 'Rate limit exceeded',
          retryAfter: windowMinutes * 60,
          currentRequests: totalRequests,
          maxRequests
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record this request
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString()
      });

    if (insertError) {
      console.error('Rate limit insert error:', insertError);
      // Don't block the request if we can't log it
    }

    // Clean up old records periodically (1% chance per request)
    if (Math.random() < 0.01) {
      await supabase.rpc('cleanup_old_rate_limits');
    }

    return new Response(
      JSON.stringify({ 
        allowed: true,
        currentRequests: totalRequests + 1,
        maxRequests,
        remainingRequests: maxRequests - totalRequests - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rate limit function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
