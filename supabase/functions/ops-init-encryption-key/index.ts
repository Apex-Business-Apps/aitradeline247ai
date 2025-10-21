import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { passphrase, action } = await req.json();

    // Validate passphrase
    const validPassphrase = Deno.env.get('OPS_INIT_PASSPHRASE');
    if (!validPassphrase) {
      console.error('❌ OPS_INIT_PASSPHRASE not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (passphrase !== validPassphrase) {
      console.warn('❌ Invalid passphrase attempt');
      return new Response(
        JSON.stringify({ error: 'Invalid passphrase' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get service role key and encryption key
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stagingEncKey = Deno.env.get('STAGING_ENC_KEY_B64');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !stagingEncKey || !supabaseUrl) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration incomplete' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔐 Calling init-encryption-key (action: ${action})`);

    // Call init-encryption-key edge function with service role
    const response = await fetch(`${supabaseUrl}/functions/v1/init-encryption-key`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Key: stagingEncKey
      }),
    });

    const result = await response.json();
    
    console.log(`✅ init-encryption-key response: status=${result.status}, env=${result.env}, fp=${result.fp}`);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        timestamp: new Date().toISOString(),
        result
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in ops-init-encryption-key:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

