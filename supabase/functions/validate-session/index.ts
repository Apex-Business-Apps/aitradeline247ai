import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateSessionRequest {
  user_id: string;
  session_token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, session_token }: ValidateSessionRequest = await req.json();

    if (!user_id || !session_token) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or session_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call server-side validation function
    const { data: validationResult, error } = await supabase.rpc('validate_session', {
      p_user_id: user_id,
      p_session_token: session_token
    });

    if (error) {
      console.error('Session validation error:', error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Validation failed',
          details: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = validationResult as {
      valid: boolean;
      reason?: string;
      session_id?: string;
      concurrent_sessions?: number;
      last_activity?: string;
    };

    if (!result.valid) {
      console.log(`Invalid session for user ${user_id}: ${result.reason}`);
      return new Response(
        JSON.stringify({
          valid: false,
          reason: result.reason || 'unknown'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful validation
    console.log(`Session validated for user ${user_id}, concurrent: ${result.concurrent_sessions}`);

    return new Response(
      JSON.stringify({
        valid: true,
        session_id: result.session_id,
        concurrent_sessions: result.concurrent_sessions,
        last_activity: result.last_activity
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Session validation function error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

