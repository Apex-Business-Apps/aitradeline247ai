// P13: Retention Enforcement Job - Automated data retention policy enforcement
// Runs daily via pg_cron to delete old data per retention policies

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Service role client for elevated permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting retention enforcement job...');

    // Call the database function to enforce retention policies
    const { data: results, error: enforceError } = await supabaseClient
      .rpc('enforce_data_retention');

    if (enforceError) {
      console.error('Retention enforcement error:', enforceError);
      throw enforceError;
    }

    console.log('Retention enforcement results:', results);

    // Also run the consent access audit
    const { data: auditResults, error: auditError } = await supabaseClient
      .rpc('audit_consent_access');

    if (auditError) {
      console.error('Consent audit error:', auditError);
    } else {
      console.log('Consent audit results:', auditResults);
    }

    // Log the job execution
    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'retention_enforcement_job',
        event_data: {
          executed_at: new Date().toISOString(),
          timezone: 'America/Edmonton',
          policies_enforced: results?.length || 0,
          results: results,
          audit_summary: auditResults,
        },
        severity: 'info',
      });

    const totalDeleted = (results || []).reduce(
      (sum: number, r: any) => sum + (r.rows_deleted || 0), 
      0
    );

    return new Response(
      JSON.stringify({
        success: true,
        executed_at: new Date().toISOString(),
        timezone: 'America/Edmonton',
        policies_enforced: results?.length || 0,
        total_rows_deleted: totalDeleted,
        results: results,
        audit_summary: auditResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Retention enforcement job error:', error);
    
    // Log the failure
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'retention_enforcement_job_failed',
        event_data: {
          executed_at: new Date().toISOString(),
          error: error.message,
        },
        severity: 'error',
      });

    return new Response(
      JSON.stringify({ error: 'Job failed', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

