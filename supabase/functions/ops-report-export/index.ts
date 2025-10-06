import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  campaign_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { campaign_id }: ReportRequest = await req.json();

    console.log(`Generating report for campaign ${campaign_id}`);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Get all campaign members with lead details
    const { data: members, error: membersError } = await supabaseClient
      .from('campaign_members')
      .select(`
        *,
        lead:leads (
          name,
          email,
          company
        )
      `)
      .eq('campaign_id', campaign_id);

    if (membersError) {
      throw membersError;
    }

    // Calculate statistics
    const stats = {
      total: members?.length || 0,
      sent: members?.filter(m => m.status === 'sent').length || 0,
      pending: members?.filter(m => m.status === 'pending').length || 0,
      failed: members?.filter(m => m.status === 'failed').length || 0,
      // Note: delivered/bounce/complaint require Resend webhook integration
      delivered: 0, // Requires webhook: resend.emails.delivered
      bounces: 0,   // Requires webhook: resend.emails.bounced
      complaints: 0 // Requires webhook: resend.emails.complained
    };

    // Get campaign-specific unsubscribes (after campaign started)
    const { data: recentUnsubs } = await supabaseClient
      .from('unsubscribes')
      .select('*')
      .gte('created_at', campaign.created_at);

    const unsubCount = recentUnsubs?.length || 0;

    // Generate CSV content
    const csvRows = [
      ['Email', 'Name', 'Company', 'Status', 'Sent At', 'Error'].join(',')
    ];

    for (const member of (members || [])) {
      const lead = member.lead as any;
      csvRows.push([
        lead?.email || '',
        lead?.name || '',
        lead?.company || '',
        member.status,
        member.sent_at || '',
        member.error_message || ''
      ].map(v => `"${v}"`).join(','));
    }

    const csvContent = csvRows.join('\n');

    // Create summary report
    const summary = {
      campaign_name: campaign.name,
      campaign_id,
      created_at: campaign.created_at,
      subject: campaign.subject,
      stats: {
        total: stats.total,
        sent: stats.sent,
        pending: stats.pending,
        failed: stats.failed,
        delivered: stats.delivered,
        bounces: stats.bounces,
        complaints: stats.complaints,
        unsubscribed: unsubCount
      },
      metrics: {
        send_rate: stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(2) + '%' : '0%',
        failure_rate: stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(2) + '%' : '0%',
        bounce_rate: stats.sent > 0 ? ((stats.bounces / stats.sent) * 100).toFixed(2) + '%' : '0%',
        complaint_rate: stats.sent > 0 ? ((stats.complaints / stats.sent) * 100).toFixed(2) + '%' : '0%',
        unsubscribe_rate: stats.sent > 0 ? ((unsubCount / stats.sent) * 100).toFixed(2) + '%' : '0%'
      },
      gates_status: {
        bounce_plus_complaint_under_2pct: stats.sent > 0 ? (((stats.bounces + stats.complaints) / stats.sent) * 100) < 2.0 : null,
        complaint_under_0_3pct: stats.sent > 0 ? ((stats.complaints / stats.sent) * 100) < 0.3 : null
      },
      notes: {
        delivered_tracking: 'Requires Resend webhook for resend.emails.delivered',
        bounce_tracking: 'Requires Resend webhook for resend.emails.bounced',
        complaint_tracking: 'Requires Resend webhook for resend.emails.complained'
      },
      export_timestamp: new Date().toISOString(),
      csv_filename: `relaunch_canada_${new Date().toISOString().split('T')[0]}.csv`
    };

    console.log('Report generated:', summary);

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'campaign_report_generated',
        event_data: summary,
        severity: 'info'
      });

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        csv_content: csvContent
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in ops-report-export:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
