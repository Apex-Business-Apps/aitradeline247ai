// PROMPT H: A2P gating (US-only)
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
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Missing Twilio credentials');
    }

    const { organizationId, usEnabled } = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check current compliance status
    const { data: existing } = await supabase
      .from('messaging_compliance')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // PROMPT H: Canada-only clients never touch A2P objects
    if (!usEnabled) {
      // Just update the flag, don't create A2P objects
      await supabase.from('messaging_compliance').upsert({
        organization_id: organizationId,
        us_enabled: false,
        a2p_status: 'not_required'
      });

      return new Response(JSON.stringify({ 
        success: true, 
        status: 'Canada-only mode',
        a2p_required: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // US enabled - run A2P workflow
    // PROMPT H: Re-running on approved campaigns is a no-op
    if (existing?.a2p_status === 'approved') {
      return new Response(JSON.stringify({ 
        success: true, 
        status: 'Already approved',
        brandSid: existing.brand_sid,
        campaignSid: existing.campaign_sid
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create A2P Brand (simplified - would need customer data)
    const brandResponse = await fetch(
      `https://messaging.twilio.com/v1/Services/${TWILIO_ACCOUNT_SID}/Brands`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          FriendlyName: `Brand for ${organizationId}`,
          // Additional brand fields would be needed
        })
      }
    );

    const brandData = await brandResponse.json();

    if (!brandResponse.ok) {
      throw new Error(`Failed to create brand: ${brandData.message}`);
    }

    // Update compliance record
    await supabase.from('messaging_compliance').upsert({
      organization_id: organizationId,
      brand_sid: brandData.sid,
      us_enabled: true,
      a2p_status: 'pending'
    });

    return new Response(JSON.stringify({
      success: true,
      brandSid: brandData.sid,
      status: 'A2P workflow initiated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-twilio-a2p:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
