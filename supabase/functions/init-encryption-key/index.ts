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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔐 Starting encryption key initialization...');

    // Check if key already exists
    const { data: existingKeys, error: checkError } = await supabase
      .from('app_config')
      .select('key_name, version')
      .eq('key_name', 'primary_aes_key')
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing keys:', checkError);
      return new Response(
        JSON.stringify({ success: false, error: checkError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingKeys) {
      console.log('⚠️  Key already exists:', existingKeys.key_name, 'v' + existingKeys.version);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Key already provisioned',
          key_name: existingKeys.key_name,
          version: existingKeys.version
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 32-byte (256-bit) cryptographically secure random key
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const keyHex = Array.from(keyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('✅ Generated 32-byte key (redacted)');

    // Insert key into app_config
    const { error: insertError } = await supabase
      .from('app_config')
      .insert({
        key_name: 'primary_aes_key',
        key_value: keyHex,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Failed to insert key:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Key inserted into app_config');

    // Verify accessor works (call get_app_encryption_key)
    const { data: accessorTest, error: accessorError } = await supabase.rpc('get_app_encryption_key');

    if (accessorError || !accessorTest) {
      console.error('❌ Accessor verification failed:', accessorError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Key inserted but accessor failed',
          details: accessorError?.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Accessor verified (returns key)');

    // Log to audit table
    const { error: auditError } = await supabase
      .from('encryption_key_audit')
      .insert({
        action: 'key_initialization',
        user_role: 'service_role',
        to_version: 1,
        reason: 'Initial key provisioning',
        metadata: {
          timestamp: new Date().toISOString(),
          method: 'init-encryption-key edge function'
        }
      });

    if (auditError) {
      console.warn('⚠️  Audit log failed:', auditError);
    }

    console.log('🎉 Encryption key initialization complete');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Encryption key initialized successfully',
        key_name: 'primary_aes_key',
        version: 1,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
