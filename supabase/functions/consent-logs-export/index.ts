// P13: Consent Logs Export - CASL/PIPEDA compliance export

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only admins can export consent logs
    const isAdmin = await supabaseClient.rpc('has_role', { 
      p_user: user.id, 
      p_role: 'admin' 
    });

    if (!isAdmin.data) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { start_date, end_date, organization_id } = await req.json();

    // Fetch consent logs
    let query = supabaseClient
      .from('consent_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: consentLogs, error: logsError } = await query;

    if (logsError) throw logsError;

    // Generate export with proper formatting
    const exportData = {
      generated_at: new Date().toISOString(),
      timezone: 'America/Edmonton',
      generated_by: user.id,
      filters: {
        start_date: start_date || 'all',
        end_date: end_date || 'all',
        organization_id: organization_id || 'all',
      },
      total_records: consentLogs?.length || 0,
      consent_logs: consentLogs || [],
      summary: {
        by_status: {},
        by_channel: {},
      },
    };

    // Calculate summary statistics
    const statusCounts: Record<string, number> = {};
    const channelCounts: Record<string, number> = {};

    (consentLogs || []).forEach((log: any) => {
      statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
      channelCounts[log.channel] = (channelCounts[log.channel] || 0) + 1;
    });

    exportData.summary.by_status = statusCounts;
    exportData.summary.by_channel = channelCounts;

    // Generate timestamped artifact
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const artifactName = `consent-logs-export-${timestamp}.json`;

    console.log(`Consent logs export: ${consentLogs?.length || 0} records`);

    return new Response(
      JSON.stringify({
        success: true,
        artifact_name: artifactName,
        data: exportData,
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${artifactName}"`,
        },
      }
    );

  } catch (error) {
    console.error('Consent logs export error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

