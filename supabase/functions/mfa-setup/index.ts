/**
 * MFA Setup Edge Function
 * Generates TOTP secret and backup codes for user
 * Backend only - no UI changes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { createRequestContext, logWithContext } from '../_shared/requestId.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TOTP secret generator
function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
  const length = 32;
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(byte => chars[byte % chars.length])
    .join('');
}

// Backup code generator
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
      .slice(0, 8);
    codes.push(code);
  }
  return codes;
}

// Hash backup code using SHA-256
async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ctx = createRequestContext(req);
  
  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logWithContext(ctx, 'warn', 'MFA setup attempted without auth');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      logWithContext(ctx, 'warn', 'MFA setup auth failed', { authError });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    ctx.userId = user.id;

    // Check if MFA already enabled
    const { data: existingMFA } = await supabase
      .from('user_mfa_settings')
      .select('totp_enabled')
      .eq('user_id', user.id)
      .single();

    if (existingMFA?.totp_enabled) {
      logWithContext(ctx, 'info', 'MFA already enabled', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'MFA already enabled. Disable first to reset.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate TOTP secret
    const totpSecret = generateTOTPSecret();
    
    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    
    // Hash backup codes for storage
    const hashedCodes = await Promise.all(
      backupCodes.map(code => hashBackupCode(code))
    );

    // Store MFA settings (TOTP disabled by default until verified)
    const { error: settingsError } = await supabase
      .from('user_mfa_settings')
      .upsert({
        user_id: user.id,
        totp_secret: totpSecret,
        totp_enabled: false,
        backup_codes_generated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (settingsError) {
      logWithContext(ctx, 'error', 'Failed to store MFA settings', { error: settingsError });
      throw settingsError;
    }

    // Delete old backup codes
    await supabase
      .from('user_backup_codes')
      .delete()
      .eq('user_id', user.id);

    // Store backup codes
    const backupCodeInserts = hashedCodes.map(hash => ({
      user_id: user.id,
      code_hash: hash,
    }));

    const { error: codesError } = await supabase
      .from('user_backup_codes')
      .insert(backupCodeInserts);

    if (codesError) {
      logWithContext(ctx, 'error', 'Failed to store backup codes', { error: codesError });
      throw codesError;
    }

    // Log security event
    await supabase.rpc('log_security_event', {
      p_event_type: 'mfa_setup_initiated',
      p_user_id: user.id,
      p_ip_address: ctx.ipAddress,
      p_event_data: { timestamp: new Date().toISOString() }
    });

    logWithContext(ctx, 'info', 'MFA setup successful', { userId: user.id });

    // Return TOTP secret and backup codes (show once only!)
    return new Response(
      JSON.stringify({
        success: true,
        totp_secret: totpSecret,
        backup_codes: backupCodes,
        qr_code_url: `otpauth://totp/TradeLine247:${user.email}?secret=${totpSecret}&issuer=TradeLine247`,
        message: 'Save these backup codes securely. They will not be shown again.'
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-ID': ctx.requestId 
        } 
      }
    );

  } catch (error) {
    logWithContext(ctx, 'error', 'MFA setup error', { error: error.message });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
