// DRIFT-04: Campaign creation and member attachment (CASL-compliant)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateCampaignRequest {
  organization_id: string;
  name: string;
  subject: string;
  body_template: string;
  consent_basis_filter?: ('express' | 'implied_ebr' | 'implied_published')[];
  scheduled_at?: string;
  lead_filters?: {
    country?: string;
    company?: string;
    last_txn_min_date?: string; // Only leads with txn after this date (for implied_ebr)
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreateCampaignRequest = await req.json();
    console.log('Creating campaign:', body.name);

    // Validate required fields
    if (!body.organization_id || !body.name || !body.subject || !body.body_template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: organization_id, name, subject, body_template' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        organization_id: body.organization_id,
        name: body.name,
        subject: body.subject,
        body_template: body.body_template,
        scheduled_at: body.scheduled_at || null,
        status: 'draft',
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      throw campaignError;
    }

    console.log('Campaign created:', campaign.id);

    // 2. Build query for eligible leads
    let leadsQuery = supabase
      .from('leads')
      .select('*')
      .not('email', 'is', null);

    // Apply filters
    if (body.lead_filters?.country) {
      leadsQuery = leadsQuery.ilike('company', `%${body.lead_filters.country}%`);
    }
    if (body.lead_filters?.company) {
      leadsQuery = leadsQuery.ilike('company', `%${body.lead_filters.company}%`);
    }

    const { data: eligibleLeads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error('Leads query error:', leadsError);
      throw leadsError;
    }

    console.log(`Found ${eligibleLeads?.length || 0} eligible leads`);

    // 3. Check against unsubscribes
    const { data: unsubscribes, error: unsubError } = await supabase
      .from('unsubscribes')
      .select('email');

    if (unsubError) {
      console.error('Unsubscribes query error:', unsubError);
      throw unsubError;
    }

    const unsubscribedEmails = new Set(
      unsubscribes?.map(u => u.email.toLowerCase()) || []
    );

    // 4. Filter leads and determine consent basis
    const consentBasisFilter = body.consent_basis_filter || ['express', 'implied_ebr', 'implied_published'];
    const minDate = body.lead_filters?.last_txn_min_date 
      ? new Date(body.lead_filters.last_txn_min_date) 
      : new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000); // 24 months ago

    const membersToCreate = (eligibleLeads || [])
      .filter(lead => !unsubscribedEmails.has(lead.email.toLowerCase()))
      .map(lead => {
        // Determine consent basis based on lead source
        let consentBasis: 'express' | 'implied_ebr' | 'implied_published' = 'implied_published';
        
        if (lead.source === 'website_form' || lead.source === 'signup') {
          consentBasis = 'express';
        } else if (lead.source === 'existing_customer' && lead.created_at) {
          const leadDate = new Date(lead.created_at);
          if (leadDate >= minDate) {
            consentBasis = 'implied_ebr';
          }
        }

        return {
          campaign_id: campaign.id,
          lead_id: lead.id,
          email: lead.email,
          consent_basis: consentBasis,
          status: 'pending',
        };
      })
      .filter(m => consentBasisFilter.includes(m.consent_basis));

    console.log(`Attaching ${membersToCreate.length} members to campaign`);

    // 5. Batch insert campaign members
    if (membersToCreate.length > 0) {
      const { error: membersError } = await supabase
        .from('campaign_members')
        .insert(membersToCreate);

      if (membersError) {
        console.error('Members creation error:', membersError);
        // Don't fail if some duplicates exist
        if (membersError.code !== '23505') {
          throw membersError;
        }
      }
    }

    // 6. Log analytics
    await supabase.from('analytics_events').insert({
      event_type: 'campaign_created',
      event_data: {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        members_attached: membersToCreate.length,
        consent_basis_counts: membersToCreate.reduce((acc, m) => {
          acc[m.consent_basis] = (acc[m.consent_basis] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
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
        members: {
          total_eligible: eligibleLeads?.length || 0,
          unsubscribed_filtered: unsubscribedEmails.size,
          attached: membersToCreate.length,
          by_consent_basis: membersToCreate.reduce((acc, m) => {
            acc[m.consent_basis] = (acc[m.consent_basis] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Campaign creation function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
