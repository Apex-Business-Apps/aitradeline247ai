import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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

    const formData = await req.formData();
    const CallSid = formData.get('CallSid') as string;
    const CallStatus = formData.get('CallStatus') as string;
    const CallDuration = formData.get('CallDuration') as string;
    const From = formData.get('From') as string;
    const To = formData.get('To') as string;
    const RecordingUrl = formData.get('RecordingUrl') as string;

    console.log('Call status update:', { CallSid, CallStatus, CallDuration });

    // Store in call_lifecycle table for tracking
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: upsertError } = await supabase
      .from('call_lifecycle')
      .upsert({
        call_sid: CallSid,
        from_number: From,
        to_number: To,
        status: CallStatus,
        direction: 'inbound',
        talk_seconds: parseInt(CallDuration || '0'),
        meta: {
          recording_url: RecordingUrl,
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'call_sid'
      });

    if (upsertError) {
      console.error('Error upserting call lifecycle:', upsertError);
    }

    // Log event for analytics
    await supabase.from('analytics_events').insert({
      event_type: 'twilio_call_status',
      event_data: {
        call_sid: CallSid,
        status: CallStatus,
        duration: CallDuration,
        from: From,
        to: To,
        recording_url: RecordingUrl,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    // Return 200 OK for idempotency
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing call status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
