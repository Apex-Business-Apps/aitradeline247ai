import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting automated threat detection scan...');

    // Run the comprehensive threat detection function
    const { data: scanResult, error } = await supabase.rpc('run_threat_detection_scan');

    if (error) {
      console.error('Threat detection scan error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = scanResult as {
      scan_completed_at: string;
      new_alerts: number;
      status: string;
    };

    console.log(`Threat detection scan complete: ${result.new_alerts} new alerts`);

    // If critical alerts detected, send notification
    if (result.new_alerts > 0) {
      const { data: criticalAlerts } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('severity', 'critical')
        .eq('resolved', false)
        .limit(5);

      if (criticalAlerts && criticalAlerts.length > 0) {
        console.warn(`🚨 ${criticalAlerts.length} CRITICAL security alerts detected!`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scan_completed_at: result.scan_completed_at,
        new_alerts: result.new_alerts,
        status: result.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Threat detection function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
