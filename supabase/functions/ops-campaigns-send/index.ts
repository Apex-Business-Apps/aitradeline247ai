// DRIFT-04: Campaign batch sending via Resend (CASL-compliant)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { checkAdminAuth } from "../_shared/adminAuth.ts";
import { sanitizeText, sanitizeEmail } from "../_shared/sanitizer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendBatchRequest {
  campaign_id: string;
  batch_size?: number; // Default 100
  dry_run?: boolean; // If true, just log what would be sent
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // SECURITY: Verify admin authentication and authorization
    const { userId } = await checkAdminAuth(req, supabase);

    const body: SendBatchRequest = await req.json();
    const batchSize = body.batch_size || 100;
    const dryRun = body.dry_run || false;

    console.log(`Sending batch for campaign ${body.campaign_id}, size: ${batchSize}, dry_run: ${dryRun}`);

    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', body.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get sendable members using the view (auto-filters unsubscribed)
    const { data: sendableMembers, error: membersError } = await supabase
      .from('v_sendable_members')
      .select('*')
      .eq('campaign_id', body.campaign_id)
      .limit(batchSize);

    if (membersError) {
      console.error('Members query error:', membersError);
      throw membersError;
    }

    if (!sendableMembers || sendableMembers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No sendable members found',
          sent: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${sendableMembers.length} sendable members`);

    // 3. Send emails via Resend
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    for (const member of sendableMembers) {
      try {
        const unsubscribeUrl = `https://www.tradeline247ai.com/unsubscribe?e=${encodeURIComponent(member.email)}`;
        
        // CASL-compliant email body
        const emailBody = campaign.body_template
          .replace(/\{email\}/g, member.email)
          .replace(/\{unsubscribe_url\}/g, unsubscribeUrl);

        if (dryRun) {
          console.log(`[DRY RUN] Would send to ${member.email}`);
          results.sent++;
        } else {
          // Send email with required headers
          const { error: sendError } = await resend.emails.send({
            from: 'TradeLine 24/7 <info@tradeline247ai.com>',
            to: member.email,
            subject: campaign.subject,
            html: emailBody,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              'X-Campaign-ID': campaign.id,
            },
          });

          if (sendError) {
            console.error(`Send error for ${member.email}:`, sendError);
            results.failed++;
            results.errors.push({
              email: member.email,
              error: sendError.message,
            });
          } else {
            console.log(`Sent to ${member.email}`);
            results.sent++;

            // Update member status
            await supabase
              .from('campaign_members')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .eq('id', member.id);
          }
        }
      } catch (error) {
        console.error(`Error sending to ${member.email}:`, error);
        results.failed++;
        results.errors.push({
          email: member.email,
          error: error.message,
        });
      }
    }

    // 4. Update campaign status if all sent
    const { data: remainingMembers } = await supabase
      .from('v_sendable_members')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', body.campaign_id);

    if (!remainingMembers || remainingMembers === 0) {
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', body.campaign_id);
    } else if (campaign.status === 'draft') {
      await supabase
        .from('campaigns')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', body.campaign_id);
    }

    // 5. Log analytics
    await supabase.from('analytics_events').insert({
      event_type: 'campaign_batch_sent',
      event_data: {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        batch_size: batchSize,
        sent: results.sent,
        failed: results.failed,
        dry_run: dryRun,
      },
      severity: 'info',
    });

    return new Response(
      JSON.stringify({
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
        },
        results,
        dry_run: dryRun,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Send batch function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
