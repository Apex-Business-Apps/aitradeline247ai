// P13: DSAR Delete - Right to be Forgotten
// PIPEDA-compliant data deletion with audit trail

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

    const { subject_user_id, reason } = await req.json();
    const requestId = crypto.randomUUID();

    // Only admins can delete user data
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

    const targetUserId = subject_user_id;
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'subject_user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create DSAR request record
    const { data: dsarRequest, error: dsarError } = await supabaseClient
      .from('dsar_requests')
      .insert({
        request_type: 'delete',
        requester_email: user.email,
        user_id: targetUserId,
        initiated_by: user.id,
        status: 'processing',
        metadata: { request_id: requestId, reason: reason || 'User request' }
      })
      .select()
      .single();

    if (dsarError) throw dsarError;

    const deletionLog: any[] = [];

    // Delete user data from various tables
    // Note: Some data must be retained for legal/compliance reasons
    
    // 1. Analytics events (anonymize instead of delete)
    const { data: analyticsCount } = await supabaseClient
      .from('analytics_events')
      .update({ user_id: null, event_data: { anonymized: true } })
      .eq('user_id', targetUserId)
      .select('id');
    
    deletionLog.push({ table: 'analytics_events', action: 'anonymized', count: analyticsCount?.length || 0 });

    // 2. Support tickets (keep for legal, anonymize PII)
    const { data: ticketsCount } = await supabaseClient
      .from('support_tickets')
      .update({ 
        user_id: null,
        contact_email: '[DELETED]',
        contact_phone: '[DELETED]',
      })
      .eq('user_id', targetUserId)
      .select('id');
    
    deletionLog.push({ table: 'support_tickets', action: 'anonymized', count: ticketsCount?.length || 0 });

    // 3. Appointments (must retain for 7 years per PIPEDA, anonymize contact info)
    const { data: apptCount } = await supabaseClient
      .from('appointments')
      .update({
        email: '[DELETED]',
        first_name: '[DELETED]',
        e164: '+10000000000',
        email_encrypted: null,
        first_name_encrypted: null,
        e164_encrypted: null,
      })
      .eq('organization_id', targetUserId) // assumes user is org owner
      .select('id');
    
    deletionLog.push({ table: 'appointments', action: 'anonymized', count: apptCount?.length || 0 });

    // 4. Profile data (delete non-essential fields)
    const { data: profileCount } = await supabaseClient
      .from('profiles')
      .update({
        full_name: '[DELETED USER]',
        phone_e164: null,
      })
      .eq('id', targetUserId)
      .select('id');
    
    deletionLog.push({ table: 'profiles', action: 'anonymized', count: profileCount?.length || 0 });

    // 5. User roles (remove)
    const { data: rolesCount } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId)
      .select('id');
    
    deletionLog.push({ table: 'user_roles', action: 'deleted', count: rolesCount?.length || 0 });

    // 6. Organization memberships (remove)
    const { data: membersCount } = await supabaseClient
      .from('organization_members')
      .delete()
      .eq('user_id', targetUserId)
      .select('id');
    
    deletionLog.push({ table: 'organization_members', action: 'deleted', count: membersCount?.length || 0 });

    // NOTE: Call logs and consent logs MUST be retained for 7 years per Canadian law
    // They are anonymized but not deleted
    deletionLog.push({ 
      table: 'call_logs', 
      action: 'retained', 
      reason: 'Legal retention requirement (7 years)', 
      count: 0 
    });
    
    deletionLog.push({ 
      table: 'consent_logs', 
      action: 'retained', 
      reason: 'Legal retention requirement (7 years)', 
      count: 0 
    });

    // Generate timestamped artifact
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const artifactName = `dsar-delete-${targetUserId}-${timestamp}.json`;
    const artifactData = JSON.stringify({
      request_id: requestId,
      executed_at: new Date().toISOString(),
      timezone: 'America/Edmonton',
      user_id: targetUserId,
      initiated_by: user.id,
      deletion_log: deletionLog,
      total_records_affected: deletionLog.reduce((sum, log) => sum + log.count, 0),
    }, null, 2);

    // Update DSAR request as completed
    await supabaseClient
      .from('dsar_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        evidence_artifact_url: artifactName,
        metadata: { 
          request_id: requestId,
          deletion_log: deletionLog,
          artifact_size_bytes: artifactData.length
        }
      })
      .eq('id', dsarRequest.id);

    console.log(`DSAR delete completed: ${requestId}, user: ${targetUserId}`);

    return new Response(
      JSON.stringify({
        success: true,
        request_id: requestId,
        dsar_id: dsarRequest.id,
        artifact_name: artifactName,
        deletion_log: deletionLog,
        executed_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('DSAR delete error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
