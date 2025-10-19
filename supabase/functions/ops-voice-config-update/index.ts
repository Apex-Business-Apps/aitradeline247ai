import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const config = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');

    // Get user's org
    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) throw new Error('No organization found');

    // Upsert voice config
    const { error } = await supabase
      .from('voice_config')
      .upsert({
        organization_id: membership.org_id,
        ...config,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Determine action type for audit
    const action = config.active_preset_id 
      ? `preset_applied:${config.active_preset_id}`
      : 'config_update';

    // Audit log
    await supabase.from('voice_config_audit').insert({
      organization_id: membership.org_id,
      user_id: user.id,
      action: action,
      changes: config,
      reason: config.active_preset_id 
        ? `Applied preset: ${config.active_preset_id}`
        : undefined
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

