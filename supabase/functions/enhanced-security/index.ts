import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityEventRequest {
  event_type: string;
  user_id?: string;
  event_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const body: SecurityEventRequest = await req.json();
      
      // Extract IP address from headers (considering proxy headers)
      const clientIP = req.headers.get('cf-connecting-ip') || 
                      req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
      
      const userAgent = req.headers.get('user-agent') || 'unknown';

      // Log security event with enhanced monitoring
      const { error: logError } = await supabaseClient.rpc('log_auth_attempt', {
        p_event_type: body.event_type,
        p_success: body.event_type.includes('success'),
        p_user_identifier: body.user_id,
        p_ip_address: clientIP,
        p_user_agent: userAgent
      });

      if (logError) {
        console.error('Failed to log security event:', logError);
      }

      // Check for anomalous patterns
      if (body.event_type === 'auth_failed') {
        // Trigger anomaly detection
        await supabaseClient.rpc('detect_auth_anomalies', {
          p_user_id: body.user_id || null,
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_event_type: body.event_type
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
          } 
        }
      );
    }

    // Security status endpoint for monitoring
    if (req.method === 'GET') {
      // Check recent security alerts
      const { data: recentAlerts, error: alertError } = await supabaseClient
        .from('security_alerts')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertError) {
        console.error('Failed to fetch security alerts:', alertError);
      }

      return new Response(
        JSON.stringify({
          status: 'operational',
          recent_alerts: recentAlerts?.length || 0,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Security function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});