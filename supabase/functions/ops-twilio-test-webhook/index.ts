import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url, type } = await req.json();
    
    if (!url || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing url or type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testing ${type} webhook:`, url);

    // Send a test request simulating Twilio
    const testPayload = new URLSearchParams({
      CallSid: 'TEST_' + Date.now(),
      From: '+15551234567',
      To: '+14319900222',
      CallStatus: 'ringing'
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: testPayload.toString()
    });

    const isSuccess = response.status === 200;
    
    console.log(`Test result: ${response.status}`, isSuccess ? '✅' : '❌');

    return new Response(
      JSON.stringify({ 
        success: isSuccess,
        status: response.status,
        statusText: response.statusText
      }),
      { 
        status: isSuccess ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Test webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
