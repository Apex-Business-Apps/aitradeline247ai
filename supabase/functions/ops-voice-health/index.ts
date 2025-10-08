import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    // Check secrets (names only)
    const secrets = {
      TWILIO_ACCOUNT_SID: !!Deno.env.get('TWILIO_ACCOUNT_SID'),
      TWILIO_AUTH_TOKEN: !!Deno.env.get('TWILIO_AUTH_TOKEN'),
      TWILIO_API_KEY: !!Deno.env.get('TWILIO_API_KEY'),
      TWILIO_API_SECRET: !!Deno.env.get('TWILIO_API_SECRET'),
      OPENAI_API_KEY: !!Deno.env.get('OPENAI_API_KEY'),
      BUSINESS_TARGET_E164: !!Deno.env.get('BUSINESS_TARGET_E164'),
    };

    // Get active Twilio numbers
    const { data: twilioNumbers } = await supabase
      .from('twilio_numbers')
      .select('*')
      .eq('active', true);

    // Get voice config
    const { data: voiceConfig } = await supabase
      .from('voice_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // Get recent webhook stats (last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: recentCalls } = await supabase
      .from('call_logs')
      .select('status, created_at')
      .gte('created_at', fifteenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    const webhookStats = {
      success_2xx: recentCalls?.filter(c => c.status === 'completed' || c.status === 'in-progress').length || 0,
      error_4xx: recentCalls?.filter(c => c.status === 'failed').length || 0,
      error_5xx: 0,
      total: recentCalls?.length || 0,
    };

    // Calculate rings to seconds
    const ringsToSeconds = (voiceConfig?.pickup_rings || 3) * 6; // ~6s per ring

    const health = {
      secrets,
      twilioNumbers: twilioNumbers || [],
      webhookUrls: {
        staging: {
          voice_answer: `${Deno.env.get('SUPABASE_URL')}/functions/v1/voice-answer`,
          voice_status: `${Deno.env.get('SUPABASE_URL')}/functions/v1/voice-status`,
          voice_consent: `${Deno.env.get('SUPABASE_URL')}/functions/v1/voice-consent`,
        },
        production: {
          voice_answer: `${Deno.env.get('SUPABASE_URL')}/functions/v1/voice-answer`,
          voice_status: `${Deno.env.get('SUPABASE_URL')}/functions/v1/voice-status`,
          voice_consent: `${Deno.env.get('SUPABASE_URL')}/functions/v1/voice-consent`,
        },
      },
      config: {
        pickup_mode: voiceConfig?.pickup_mode || 'after_rings',
        pickup_rings: voiceConfig?.pickup_rings || 3,
        pickup_seconds: ringsToSeconds,
        panic_mode: voiceConfig?.panic_mode || false,
        llm_enabled: voiceConfig?.llm_enabled !== false,
      },
      webhookStats,
      lastCheck: new Date().toISOString(),
    };

    return new Response(JSON.stringify(health), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Voice health check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
