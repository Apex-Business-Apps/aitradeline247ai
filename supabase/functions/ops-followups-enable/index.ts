import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FollowupRequest {
  campaign_id: string;
  day3_enabled?: boolean;
  day7_enabled?: boolean;
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

    const { 
      campaign_id, 
      day3_enabled = true,
      day7_enabled = true
    }: FollowupRequest = await req.json();

    console.log(`Enabling follow-ups for campaign ${campaign_id}`);

    // Get all sent campaign members
    const { data: sentMembers, error: membersError } = await supabaseClient
      .from('campaign_members')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('status', 'sent')
      .not('sent_at', 'is', null);

    if (membersError) {
      throw membersError;
    }

    if (!sentMembers || sentMembers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No sent emails to schedule follow-ups for' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${sentMembers.length} sent members`);

    // Schedule follow-ups (idempotent - upsert)
    const followups = [];

    for (const member of sentMembers) {
      const sentDate = new Date(member.sent_at);

      // Day 3 nudge
      if (day3_enabled) {
        const day3Date = new Date(sentDate);
        day3Date.setDate(day3Date.getDate() + 3);
        
        followups.push({
          campaign_id,
          member_id: member.id,
          followup_number: 1,
          scheduled_at: day3Date.toISOString(),
          status: 'pending'
        });
      }

      // Day 7 final
      if (day7_enabled) {
        const day7Date = new Date(sentDate);
        day7Date.setDate(day7Date.getDate() + 7);
        
        followups.push({
          campaign_id,
          member_id: member.id,
          followup_number: 2,
          scheduled_at: day7Date.toISOString(),
          status: 'pending'
        });
      }
    }

    // Upsert follow-ups (idempotent)
    const { data: insertedFollowups, error: followupsError } = await supabaseClient
      .from('campaign_followups')
      .upsert(followups, { 
        onConflict: 'member_id,followup_number',
        ignoreDuplicates: false 
      })
      .select();

    if (followupsError) {
      throw followupsError;
    }

    console.log(`Scheduled ${insertedFollowups?.length || 0} follow-ups`);

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'followups_enabled',
        event_data: {
          campaign_id,
          day3_enabled,
          day7_enabled,
          scheduled_count: insertedFollowups?.length || 0,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      });

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id,
        scheduled_count: insertedFollowups?.length || 0,
        day3_enabled,
        day7_enabled
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in ops-followups-enable:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
