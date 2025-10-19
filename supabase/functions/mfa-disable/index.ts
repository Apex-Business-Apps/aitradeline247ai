/**
 * MFA Disable Edge Function
 * Disables MFA for user (requires password confirmation)
 * Backend only - no UI changes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { createRequestContext, logWithContext } from '../_shared/requestId.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { password } = await req.json();
    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password required to disable MFA' }),
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

    // Verify password using Supabase auth
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { error: passwordError } = await supabaseClient.auth.signInWithPassword({
      email: user.email!,
      password: password
    });

    if (passwordError) {
      logWithContext(ctx, 'warn', 'Invalid password for MFA disable', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Disable MFA
    const { error: disableError } = await supabase
      .from('user_mfa_settings')
      .update({ totp_enabled: false })
      .eq('user_id', user.id);

    if (disableError) {
      throw disableError;
    }

    // Delete backup codes
    await supabase
      .from('user_backup_codes')
      .delete()
      .eq('user_id', user.id);

    // Log security event
    await supabase.rpc('log_security_event', {
      p_event_type: 'mfa_disabled',
      p_user_id: user.id,
      p_ip_address: ctx.ipAddress,
      p_event_data: { timestamp: new Date().toISOString() }
    });

    logWithContext(ctx, 'info', 'MFA disabled', { userId: user.id });

    return new Response(
      JSON.stringify({ success: true, message: 'MFA disabled successfully' }),
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
    logWithContext(ctx, 'error', 'MFA disable error', { error: error.message });
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

