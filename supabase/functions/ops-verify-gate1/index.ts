import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { passphrase } = await req.json();

    // Validate passphrase
    const validPassphrase = Deno.env.get('OPS_INIT_PASSPHRASE');
    if (!validPassphrase || passphrase !== validPassphrase) {
      return new Response(
        JSON.stringify({ error: 'Invalid passphrase' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('🔍 Running Gate-1 verification checks');

    // Check 1: app_config has exactly one active primary_aes_key (Base64)
    const { data: appConfig, error: configError } = await supabase
      .from('app_config')
      .select('key_name, version, created_at, updated_at')
      .eq('key_name', 'primary_aes_key');

    const keyCheck = {
      pass: appConfig && appConfig.length === 1,
      count: appConfig?.length || 0,
      version: appConfig?.[0]?.version,
      created_at: appConfig?.[0]?.created_at,
      error: configError?.message
    };

    console.log(`✅ Key check: ${keyCheck.pass ? 'PASS' : 'FAIL'} (count: ${keyCheck.count})`);

    // Check 2: get_app_encryption_key() returns non-null via service_role
    const { data: keyData, error: keyError } = await supabase.rpc('get_app_encryption_key');
    
    const accessorCheck = {
      service_role_access: keyData !== null && !keyError,
      key_present: keyData !== null,
      error: keyError?.message
    };

    console.log(`✅ Accessor check: ${accessorCheck.service_role_access ? 'PASS' : 'FAIL'}`);

    // Check 3: Audit entries
    const { data: auditData, error: auditError } = await supabase
      .from('encryption_key_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const auditCheck = {
      entries_found: auditData?.length || 0,
      latest_entries: auditData?.map(entry => ({
        action: entry.action,
        user_role: entry.user_role,
        version: entry.to_version,
        masked_fp: entry.metadata?.masked_fp,
        env: entry.metadata?.env,
        timestamp: entry.created_at
      })),
      error: auditError?.message
    };

    console.log(`✅ Audit check: ${auditCheck.entries_found} entries found`);

    // Overall gate status
    const gateStatus = keyCheck.pass && accessorCheck.service_role_access ? 'PASS' : 'FAIL';

    console.log(`🎯 Gate-1 overall status: ${gateStatus}`);

    return new Response(
      JSON.stringify({
        gate_status: gateStatus,
        timestamp: new Date().toISOString(),
        env: Deno.env.get('DENO_DEPLOYMENT_ID') || 'local',
        checks: {
          key_in_app_config: keyCheck,
          accessor_function: accessorCheck,
          audit_trail: auditCheck
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in ops-verify-gate1:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
