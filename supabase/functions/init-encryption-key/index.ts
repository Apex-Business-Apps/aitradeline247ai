import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate SHA256 fingerprint and return first 8 hex chars (masked)
async function getMaskedFingerprint(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 8);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT and verify service_role
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: service_role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify service_role by checking JWT claims
    const token = authHeader.replace('Bearer ', '');
    if (token !== supabaseServiceKey) {
      console.warn('❌ Invalid service_role token');
      return new Response(
        JSON.stringify({ error: 'Forbidden: service_role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔐 Starting encryption key initialization (service_role verified)');

    // Parse input
    const body = await req.json();
    const { base64Key } = body;

    if (!base64Key || typeof base64Key !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input: base64Key required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Base64 and decode
    let keyBytes: Uint8Array;
    try {
      // Use atob for Base64 decoding
      const binaryString = atob(base64Key);
      keyBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        keyBytes[i] = binaryString.charCodeAt(i);
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid Base64 encoding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate key length (must be 32 bytes)
    if (keyBytes.length !== 32) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid key length: expected 32 bytes, got ${keyBytes.length}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to hex for storage (PostgreSQL-friendly)
    const keyHex = Array.from(keyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate masked fingerprint for audit
    const maskedFp = await getMaskedFingerprint(keyHex);
    console.log('✅ Key validated (32 bytes), masked fp:', maskedFp);

    // Check if key already exists
    const { data: existingKey, error: checkError } = await supabase
      .from('app_config')
      .select('key_value, version')
      .eq('key_name', 'primary_aes_key')
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing keys:', checkError);
      return new Response(
        JSON.stringify({ error: checkError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for idempotency: if same key already exists, return noop
    if (existingKey) {
      const existingFp = await getMaskedFingerprint(existingKey.key_value);
      if (existingFp === maskedFp) {
        console.log('⚠️  Identical key already exists (idempotent noop)');
        return new Response(
          JSON.stringify({ 
            status: 'noop',
            env: Deno.env.get('DENO_DEPLOYMENT_ID') || 'local',
            fp: maskedFp,
            message: 'Key already provisioned with same fingerprint'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine if this is create or rotate
    const action = existingKey ? 'rotate' : 'create';
    const newVersion = existingKey ? (existingKey.version || 1) + 1 : 1;

    // UPSERT key into app_config
    const { error: upsertError } = await supabase
      .from('app_config')
      .upsert({
        key_name: 'primary_aes_key',
        key_value: keyHex,
        version: newVersion,
        updated_at: new Date().toISOString(),
        ...(action === 'create' ? { created_at: new Date().toISOString() } : {})
      }, {
        onConflict: 'key_name'
      });

    if (upsertError) {
      console.error('❌ Failed to upsert key:', upsertError);
      return new Response(
        JSON.stringify({ error: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Key ${action}d in app_config (version ${newVersion})`);

    // Write audit entry
    const { error: auditError } = await supabase
      .from('encryption_key_audit')
      .insert({
        action,
        user_role: 'service_role',
        from_version: action === 'rotate' ? existingKey.version : null,
        to_version: newVersion,
        reason: `Key ${action} via init-encryption-key edge function`,
        metadata: {
          timestamp: new Date().toISOString(),
          env: Deno.env.get('DENO_DEPLOYMENT_ID') || 'local',
          masked_fp: maskedFp,
          method: 'init-encryption-key'
        }
      });

    if (auditError) {
      console.warn('⚠️  Audit log failed:', auditError);
    } else {
      console.log('✅ Audit entry created');
    }

    // Verify accessor works
    const { data: accessorTest, error: accessorError } = await supabase.rpc('get_app_encryption_key');
    if (accessorError || !accessorTest) {
      console.error('❌ Accessor verification failed:', accessorError);
    } else {
      console.log('✅ Accessor verified');
    }

    console.log('🎉 Encryption key initialization complete');

    return new Response(
      JSON.stringify({
        status: 'ok',
        env: Deno.env.get('DENO_DEPLOYMENT_ID') || 'local',
        fp: maskedFp,
        action,
        version: newVersion
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

