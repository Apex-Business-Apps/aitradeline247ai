// P13: DSAR Export - Data Subject Access Request Export
// PIPEDA-compliant data export with secret redaction

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

    const { email, subject_user_id } = await req.json();
    const requestId = crypto.randomUUID();

    // Validate: admin can export any user, users can export themselves
    const isAdmin = await supabaseClient.rpc('has_role', { 
      p_user: user.id, 
      p_role: 'admin' 
    });

    const targetUserId = subject_user_id || user.id;

    if (!isAdmin.data && targetUserId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create DSAR request record
    const { data: dsarRequest, error: dsarError } = await supabaseClient
      .from('dsar_requests')
      .insert({
        request_type: 'export',
        requester_email: email || user.email,
        user_id: targetUserId,
        initiated_by: user.id,
        status: 'processing',
        metadata: { request_id: requestId }
      })
      .select()
      .single();

    if (dsarError) throw dsarError;

    // Gather all user data from relevant tables
    const exportData: any = {
      request_id: requestId,
      generated_at: new Date().toISOString(),
      timezone: 'America/Edmonton',
      user_id: targetUserId,
      personal_information: {},
      activity_data: {},
      consent_records: {},
      support_tickets: {},
      communications: {},
    };

    // Fetch user profile (redact sensitive fields)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id, full_name, created_at, updated_at')
      .eq('id', targetUserId)
      .single();
    
    exportData.personal_information.profile = profile;

    // Fetch appointments (sanitized)
    const { data: appointments } = await supabaseClient
      .from('appointments')
      .select('id, start_at, end_at, status, source, note, created_at')
      .eq('e164', profile?.phone_e164 || '');
    
    exportData.activity_data.appointments = appointments || [];

    // Fetch call logs
    const { data: calls } = await supabaseClient
      .from('call_logs')
      .select('id, call_sid, from_e164, to_e164, status, duration_sec, created_at, summary')
      .or(`from_e164.eq.${profile?.phone_e164},to_e164.eq.${profile?.phone_e164}`);
    
    exportData.activity_data.call_logs = calls || [];

    // Fetch consent logs
    const { data: consents } = await supabaseClient
      .from('consent_logs')
      .select('*')
      .eq('e164', profile?.phone_e164 || '');
    
    exportData.consent_records.consent_logs = consents || [];

    // Fetch support tickets
    const { data: tickets } = await supabaseClient
      .from('support_tickets')
      .select('id, subject, status, priority, created_at, resolved_at')
      .eq('user_id', targetUserId);
    
    exportData.support_tickets.tickets = tickets || [];

    // Fetch analytics events (non-PII only)
    const { data: analytics } = await supabaseClient
      .from('analytics_events')
      .select('id, event_type, created_at, severity')
      .eq('user_id', targetUserId)
      .limit(1000);
    
    exportData.activity_data.analytics = analytics || [];

    // Redact secrets function
    const redactSecrets = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'api_key', 'auth_token'];
      
      for (const key in redacted) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          redacted[key] = '[REDACTED]';
        } else if (typeof redacted[key] === 'object') {
          redacted[key] = redactSecrets(redacted[key]);
        }
      }
      return redacted;
    };

    const redactedExport = redactSecrets(exportData);

    // Generate timestamped artifact filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const artifactName = `dsar-export-${targetUserId}-${timestamp}.json`;

    // Store artifact (in production, upload to storage bucket)
    const artifactData = JSON.stringify(redactedExport, null, 2);

    // Update DSAR request as completed
    await supabaseClient
      .from('dsar_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        evidence_artifact_url: artifactName,
        metadata: { 
          request_id: requestId,
          total_records: Object.values(redactedExport).flat().length,
          artifact_size_bytes: artifactData.length
        }
      })
      .eq('id', dsarRequest.id);

    console.log(`DSAR export completed: ${requestId}, user: ${targetUserId}`);

    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        dsar_id: dsarRequest.id,
        artifact_name: artifactName,
        data: redactedExport,
        generated_at: exportData.generated_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('DSAR export error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
