/**
 * MFA Backup Code Verification Edge Function
 * Verifies backup codes for account recovery
 * Backend only - no UI changes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { createRequestContext, logWithContext } from '../_shared/requestId.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { backup_code } = await req.json();
    if (!backup_code || backup_code.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'Invalid backup code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    ctx.userId = user.id;

    // Hash the provided code
    const codeHash = await hashBackupCode(backup_code.toUpperCase());

    // Check if code exists and is unused
    const { data: backupCode, error: codeError } = await supabase
      .from('user_backup_codes')
      .select('id, used_at')
      .eq('user_id', user.id)
      .eq('code_hash', codeHash)
      .is('used_at', null)
      .single();

    const isValid = !codeError && backupCode;

    // Log attempt
    await supabase.from('mfa_verification_attempts').insert({
      user_id: user.id,
      ip_address: ctx.ipAddress,
      success: isValid,
      attempt_type: 'backup_code'
    });

    if (!isValid) {
      logWithContext(ctx, 'warn', 'Invalid backup code', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Invalid or already used backup code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as used
    await supabase
      .from('user_backup_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', backupCode.id);

    // Check remaining codes
    const { data: remainingCodes } = await supabase
      .from('user_backup_codes')
      .select('id')
      .eq('user_id', user.id)
      .is('used_at', null);

    const remainingCount = remainingCodes?.length || 0;

    // Log security event
    await supabase.rpc('log_security_event', {
      p_event_type: 'mfa_backup_code_used',
      p_user_id: user.id,
      p_ip_address: ctx.ipAddress,
      p_event_data: { 
        timestamp: new Date().toISOString(),
        remaining_codes: remainingCount
      }
    });

    logWithContext(ctx, 'info', 'Backup code verified', { 
      userId: user.id, 
      remainingCodes: remainingCount 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Backup code verified',
        remaining_codes: remainingCount,
        warning: remainingCount <= 2 ? 'Low backup codes remaining. Consider generating new ones.' : null
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
    logWithContext(ctx, 'error', 'Backup code verification error', { error: error.message });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
