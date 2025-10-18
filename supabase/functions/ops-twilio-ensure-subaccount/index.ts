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

    const { tenant_id, business_name } = await req.json();
    
    if (!tenant_id || !business_name) {
      throw new Error('Missing required fields: tenant_id, business_name');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if subaccount already exists for this tenant
    const { data: existing } = await supabase
      .from('twilio_subaccounts')
      .select('subaccount_sid')
      .eq('tenant_id', tenant_id)
      .single();

    if (existing?.subaccount_sid) {
      console.log('Subaccount already exists:', existing.subaccount_sid);
      return new Response(JSON.stringify({
        success: true,
        subaccount_sid: existing.subaccount_sid,
        status: 'existing'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create new Twilio subaccount
    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const createResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          FriendlyName: `${business_name} (${tenant_id})`
        })
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Twilio API error: ${errorText}`);
    }

    const subaccount = await createResponse.json();

    // Store subaccount info
    await supabase.from('twilio_subaccounts').insert({
      tenant_id,
      subaccount_sid: subaccount.sid,
      business_name,
      status: 'active',
      metadata: {
        date_created: subaccount.date_created,
        friendly_name: subaccount.friendly_name
      }
    });

    // Log event
    await supabase.from('analytics_events').insert({
      event_type: 'twilio_subaccount_created',
      event_data: {
        tenant_id,
        subaccount_sid: subaccount.sid,
        business_name
      },
      severity: 'info'
    });

    console.log('Subaccount created:', subaccount.sid);

    return new Response(JSON.stringify({
      success: true,
      subaccount_sid: subaccount.sid,
      status: 'created'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-twilio-ensure-subaccount:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
