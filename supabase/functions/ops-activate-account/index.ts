import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { userId, organizationName, plan, role } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create or get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({ name: organizationName }, { onConflict: 'name' })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add user to organization
    await supabase.from('organization_members').upsert({
      org_id: org.id,
      user_id: userId,
      role: role
    });

    // Update user profile
    await supabase.from('profiles').upsert({
      id: userId,
      plan: plan,
      status: 'active'
    });

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: userId,
      org_id: org.id,
      action: 'account_activated',
      payload: { organizationName, plan, role }
    });

    return new Response(JSON.stringify({
      organization: org,
      user: { plan, role, status: 'active' },
      timestamp: new Date().toISOString()
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

