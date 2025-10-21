import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SessionActivityRequest {
  user_id: string;
  session_token: string;
  activity_timestamp: string;
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, session_token, activity_timestamp }: SessionActivityRequest = await req.json();

    if (!user_id || !session_token || !activity_timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or insert session activity using background task for better performance
    const sessionUpdateTask = async () => {
      const { data: existingSession, error: selectError } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', user_id)
        .eq('session_token', session_token)
        .eq('is_active', true)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing session:', selectError);
        return;
      }

      if (existingSession) {
        // Update existing session
        const { error: updateError } = await supabase
          .from('user_sessions')
          .update({
            last_activity: activity_timestamp,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', existingSession.id);

        if (updateError) {
          console.error('Error updating session activity:', updateError);
        }
      } else {
        // Create new session record
        const { error: insertError } = await supabase
          .from('user_sessions')
          .insert({
            user_id,
            session_token,
            last_activity: activity_timestamp,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });

        if (insertError) {
          console.error('Error creating session record:', insertError);
        }
      }

      // Clean up expired sessions and log security event
      await Promise.all([
        supabase.rpc('cleanup_expired_sessions'),
        supabase.from('analytics_events').insert({
          event_type: 'session_activity',
          event_data: {
            user_id,
            activity_type: 'session_update',
            timestamp: activity_timestamp
          },
          user_session: user_id,
          page_url: 'session_tracking'
        })
      ]);
    };

    // Execute session update task (simplified for compatibility)
    sessionUpdateTask().catch(console.error);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Session tracking error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
