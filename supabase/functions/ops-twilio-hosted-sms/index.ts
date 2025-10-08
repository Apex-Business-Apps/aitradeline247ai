import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Missing Twilio credentials');
    }

    const { phoneNumber, loaDocument } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log hosted SMS request
    const submissionId = crypto.randomUUID();
    
    await supabase.from('analytics_events').insert({
      event_type: 'hosted_sms_requested',
      event_data: {
        submission_id: submissionId,
        phone_number: phoneNumber,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    // Note: Actual Twilio Hosted SMS LOA submission would go here
    // This is a placeholder for the actual Twilio API integration

    console.log('Hosted SMS requested for:', phoneNumber);

    return new Response(JSON.stringify({
      success: true,
      submissionId,
      phoneNumber,
      status: 'pending_approval'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-twilio-hosted-sms:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
