import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAdminAuth } from "../_shared/adminAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SegmentRequest {
  campaign_id: string;
  segment_size?: number;
  seed_emails?: string[];
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

    // Security: Verify admin access
    await checkAdminAuth(req, supabaseClient);

    const { 
      campaign_id, 
      segment_size = 50,
      seed_emails = []
    }: SegmentRequest = await req.json();

    console.log(`Creating Warm-50 segment for campaign ${campaign_id}`);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Clear existing campaign members (idempotent replace)
    await supabaseClient
      .from('campaign_members')
      .delete()
      .eq('campaign_id', campaign_id);

    console.log('Cleared existing campaign members');

    // Get leads from the import list (from notes metadata)
    const { data: allLeads, error: leadsError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('source', 'csv_import')
      .order('created_at', { ascending: false });

    if (leadsError) {
      throw leadsError;
    }

    console.log(`Found ${allLeads?.length || 0} imported leads`);

    // Filter by CASL compliance (express consent from csv_import source)
    // Filter out unsubscribed
    const { data: unsubscribeList } = await supabaseClient
      .from('unsubscribes')
      .select('email');
    
    const unsubscribedEmails = new Set(
      (unsubscribeList || []).map(u => u.email.toLowerCase())
    );

    const validLeads = (allLeads || []).filter(lead => {
      // Must have email
      if (!lead.email) return false;
      
      // Not unsubscribed
      if (unsubscribedEmails.has(lead.email.toLowerCase())) return false;
      
      // CASL filter: express consent basis (csv import = existing business relationship)
      if (!campaign.consent_basis_filter.includes('express')) return false;
      
      return true;
    });

    console.log(`Valid CASL-compliant leads: ${validLeads.length}`);

    // Take first 50
    const selectedLeads = validLeads.slice(0, segment_size);

    console.log(`Selected ${selectedLeads.length} leads for segment`);

    // Add seed inboxes to the segment
    const seedLeads = seed_emails.map(email => ({
      name: 'Seed Contact',
      email,
      company: 'Internal Test',
      notes: JSON.stringify({ is_seed: true }),
      source: 'seed_inbox'
    }));

    // Upsert seed leads
    if (seedLeads.length > 0) {
      await supabaseClient
        .from('leads')
        .upsert(seedLeads, { onConflict: 'email' });
      
      console.log(`Added ${seedLeads.length} seed contacts`);
    }

    // Combine selected leads and seeds
    const allSegmentLeads = [...selectedLeads, ...seedLeads.map(s => ({ 
      id: null, 
      email: s.email, 
      name: s.name,
      company: s.company,
      notes: s.notes,
      source: s.source
    }))];

    // Create campaign members
    const members = [];
    for (const lead of allSegmentLeads) {
      let leadId = lead.id;
      
      // If seed, find or get its ID
      if (!leadId) {
        const { data: foundLead } = await supabaseClient
          .from('leads')
          .select('id')
          .eq('email', lead.email)
          .single();
        
        leadId = foundLead?.id;
      }

      if (leadId) {
        members.push({
          campaign_id,
          lead_id: leadId,
          status: 'pending'
        });
      }
    }

    const { data: insertedMembers, error: membersError } = await supabaseClient
      .from('campaign_members')
      .insert(members)
      .select();

    if (membersError) {
      throw membersError;
    }

    console.log(`Created ${insertedMembers?.length || 0} campaign members`);

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'segment_created',
        event_data: {
          segment_name: 'Warm-50',
          campaign_id,
          size: insertedMembers?.length || 0,
          seeds: seed_emails.length,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      });

    return new Response(
      JSON.stringify({
        success: true,
        segment_name: 'Warm-50',
        campaign_id,
        total_selected: selectedLeads.length,
        seeds_added: seed_emails.length,
        total_members: insertedMembers?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in ops-segment-warm50:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
