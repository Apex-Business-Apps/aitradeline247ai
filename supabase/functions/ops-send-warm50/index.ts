import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { checkAdminAuth } from "../_shared/adminAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendRequest {
  campaign_id: string;
  max_sends?: number;
  throttle_per_minute?: number;
  from_email?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Security: Verify admin access
    const { userId } = await checkAdminAuth(req, supabaseClient);

    const { 
      campaign_id, 
      max_sends = 50,
      throttle_per_minute = 30,
      from_email = 'Adeline at TradeLine 24/7 <hello@tradeline247ai.com>'
    }: SendRequest = await req.json();

    console.log(`Starting send for campaign ${campaign_id}, max ${max_sends} emails`);

    // Get sendable members (view already filters out unsubscribed)
    const { data: members, error: membersError } = await supabaseClient
      .from('v_sendable_members')
      .select('*')
      .eq('campaign_id', campaign_id)
      .limit(max_sends);

    if (membersError) {
      throw membersError;
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No sendable members found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${members.length} sendable members`);

    const results = {
      sent: 0,
      failed: 0,
      throttled: 0
    };

    const delayMs = Math.ceil(60000 / throttle_per_minute);

    // Send emails with throttling
    for (const member of members) {
      try {
        // Personalize template
        const firstName = member.name.split(' ')[0] || 'there';
        const bookingLink = 'https://calendly.com/tradeline247/demo'; // Replace with actual
        const unsubscribeLink = `https://www.tradeline247ai.com/unsubscribe?e=${encodeURIComponent(member.email)}`;

        let body = member.body_template
          .replace(/\{\{first_name\}\}/g, firstName)
          .replace(/\{\{booking_link\}\}/g, bookingLink)
          .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeLink);

        // Send via Resend
        const emailResponse = await resend.emails.send({
          from: from_email,
          to: member.email,
          subject: member.subject,
          html: body.replace(/\n/g, '<br>'),
          headers: {
            'List-Unsubscribe': `<${unsubscribeLink}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        });

        if (emailResponse.error) {
          throw emailResponse.error;
        }

        console.log(`✅ Sent to ${member.email}`);

        // Update member status
        await supabaseClient
          .from('campaign_members')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', member.member_id);

        results.sent++;

        // Throttle
        if (results.sent < members.length) {
          await sleep(delayMs);
          results.throttled++;
        }

      } catch (error: any) {
        console.error(`❌ Failed to send to ${member.email}:`, error);
        
        await supabaseClient
          .from('campaign_members')
          .update({ 
            status: 'failed',
            error_message: error.message 
          })
          .eq('id', member.member_id);

        results.failed++;
      }
    }

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'campaign_batch_sent',
        user_id: userId,
        event_data: {
          campaign_id,
          ...results,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      });

    // Check gates
    const bounceComplaintRate = (results.failed / results.sent) * 100;
    const warningMsg = bounceComplaintRate >= 2 
      ? '⚠️ Bounce/complaint rate exceeds 2% threshold. Review before scaling.' 
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id,
        results,
        warning: warningMsg
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in ops-send-warm50:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
