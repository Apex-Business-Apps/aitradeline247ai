/**
 * MFA Verification Edge Function
 * Verifies TOTP code and enables MFA
 * Backend only - no UI changes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { createRequestContext, logWithContext } from '../_shared/requestId.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TOTP verification using HMAC-SHA1
async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  const window = 1; // Allow 1 step before/after current time
  const timeStep = 30; // 30 second intervals
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const time = currentTime + i;
    const computedToken = await generateTOTP(secret, time);
    if (computedToken === token) {
      return true;
    }
  }
  return false;
}

// Generate TOTP token
async function generateTOTP(secret: string, time: number): Promise<string> {
  // Decode base32 secret
  const key = base32Decode(secret);
  
  // Convert time to 8-byte buffer
  const timeBytes = new ArrayBuffer(8);
  const timeView = new DataView(timeBytes);
  timeView.setBigUint64(0, BigInt(time), false);

  // HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBytes);
  const hmac = new Uint8Array(signature);
  
  // Dynamic truncation
  const offset = hmac[19] & 0xf;
  const binary = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  );
  
  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

// Base32 decoder
function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanInput = base32.toUpperCase().replace(/=+$/, '');
  
  let bits = '';
  for (const char of cleanInput) {
    const val = alphabet.indexOf(char);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  
  return bytes;
}

// Rate limit check
async function checkRateLimit(supabase: any, userId: string, ipAddress: string): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('mfa_verification_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('success', false)
    .gte('created_at', fiveMinutesAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }

  // Allow max 5 failed attempts per 5 minutes
  return (data?.length || 0) < 5;
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

    const { token } = await req.json();
    if (!token || token.length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
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

    // Rate limit check
    const allowed = await checkRateLimit(supabase, user.id, ctx.ipAddress);
    if (!allowed) {
      logWithContext(ctx, 'warn', 'MFA verification rate limited', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Too many failed attempts. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get MFA settings
    const { data: mfaSettings, error: settingsError } = await supabase
      .from('user_mfa_settings')
      .select('totp_secret, totp_enabled')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !mfaSettings) {
      return new Response(
        JSON.stringify({ error: 'MFA not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify TOTP
    const isValid = await verifyTOTP(mfaSettings.totp_secret, token);

    // Log attempt
    await supabase.from('mfa_verification_attempts').insert({
      user_id: user.id,
      ip_address: ctx.ipAddress,
      success: isValid,
      attempt_type: 'totp'
    });

    if (!isValid) {
      logWithContext(ctx, 'warn', 'Invalid MFA token', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enable MFA if not already enabled
    if (!mfaSettings.totp_enabled) {
      await supabase
        .from('user_mfa_settings')
        .update({ totp_enabled: true })
        .eq('user_id', user.id);

      await supabase.rpc('log_security_event', {
        p_event_type: 'mfa_enabled',
        p_user_id: user.id,
        p_ip_address: ctx.ipAddress,
        p_event_data: { timestamp: new Date().toISOString() }
      });
    }

    logWithContext(ctx, 'info', 'MFA verification successful', { userId: user.id });

    return new Response(
      JSON.stringify({ success: true, message: 'MFA verified and enabled' }),
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
    logWithContext(ctx, 'error', 'MFA verification error', { error: error.message });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
