import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing pending follow-ups...');

    // Get pending follow-ups that are due
    const { data: pendingFollowups, error: followupsError } = await supabaseClient
      .from('campaign_followups')
      .select(`
        *,
        campaign:campaigns(*),
        member:campaign_members(
          *,
          lead:leads(*)
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (followupsError) {
      throw followupsError;
    }

    if (!pendingFollowups || pendingFollowups.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending follow-ups to send',
          processed: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${pendingFollowups.length} pending follow-ups`);

    const results = {
      sent: 0,
      halted: 0,
      failed: 0
    };

    for (const followup of pendingFollowups) {
      const member = followup.member as any;
      const lead = member.lead;
      const campaign = followup.campaign as any;

      try {
        // Check halt conditions
        // 1. Check if member status changed (replied, bounced, complained)
        if (['replied', 'bounced', 'complained', 'unsubscribed'].includes(member.status)) {
          await supabaseClient
            .from('campaign_followups')
            .update({ 
              status: 'halted',
              halted_reason: `Member status: ${member.status}`
            })
            .eq('id', followup.id);
          
          results.halted++;
          console.log(`Halted follow-up for ${lead.email}: ${member.status}`);
          continue;
        }

        // 2. Check if email is now unsubscribed
        const { data: unsub } = await supabaseClient
          .from('unsubscribes')
          .select('email')
          .ilike('email', lead.email)
          .single();

        if (unsub) {
          await supabaseClient
            .from('campaign_followups')
            .update({ 
              status: 'halted',
              halted_reason: 'Unsubscribed'
            })
            .eq('id', followup.id);
          
          results.halted++;
          console.log(`Halted follow-up for ${lead.email}: unsubscribed`);
          continue;
        }

        // Send follow-up email
        const firstName = lead.name.split(' ')[0] || 'there';
        const bookingLink = 'https://calendly.com/tradeline247/demo';
        const unsubscribeLink = `https://www.tradeline247ai.com/unsubscribe?e=${encodeURIComponent(lead.email)}`;

        // Customize message based on follow-up number
        let followupMessage = '';
        if (followup.followup_number === 1) {
          // Day 3 nudge
          followupMessage = `Hi ${firstName},\n\nJust circling back on my note from a few days ago.\n\nStill curious about your plan when calls overlap or come after hours. If TradeLine 24/7 sounds useful, I'd love to show you a quick 10-minute demo: ${bookingLink}\n\nNo pressure—if now's not the time, just let me know.\n\nUnsubscribe: ${unsubscribeLink}`;
        } else {
          // Day 7 final
          followupMessage = `Hi ${firstName},\n\nLast check-in from me. If you're interested in seeing how TradeLine 24/7 can help catch those after-hours calls and bookings, I'm here: ${bookingLink}\n\nOtherwise, I'll leave you to it. Thanks for your time!\n\nUnsubscribe: ${unsubscribeLink}`;
        }

        const subject = followup.followup_number === 1 
          ? `Re: ${campaign.subject}` 
          : `Final note: ${campaign.subject}`;

        const emailResponse = await resend.emails.send({
          from: 'Adeline at TradeLine 24/7 <hello@tradeline247ai.com>',
          to: lead.email,
          subject,
          html: followupMessage.replace(/\n/g, '<br>'),
          headers: {
            'List-Unsubscribe': `<${unsubscribeLink}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        });

        if (emailResponse.error) {
          throw emailResponse.error;
        }

        // Update follow-up status
        await supabaseClient
          .from('campaign_followups')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', followup.id);

        results.sent++;
        console.log(`✅ Sent follow-up #${followup.followup_number} to ${lead.email}`);

      } catch (error: any) {
        console.error(`❌ Failed to send follow-up to ${lead?.email}:`, error);
        
        await supabaseClient
          .from('campaign_followups')
          .update({ 
            status: 'failed',
            halted_reason: error.message
          })
          .eq('id', followup.id);

        results.failed++;
      }
    }

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'followups_processed',
        event_data: {
          ...results,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      });

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingFollowups.length,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in ops-followups-send:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
