import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isValidE164, normalizeToE164 } from "../_shared/e164.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LookupResult {
  e164: string;
  carrier?: {
    type: string; // mobile, landline, voip
    name: string;
  };
  callerName?: {
    caller_name: string;
    caller_type: string;
  };
  countryCode: string;
  nationalFormat: string;
  valid: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Twilio credentials not configured');
    }

    const { phone_number } = await req.json();
    
    if (!phone_number) {
      return new Response(JSON.stringify({ error: 'phone_number required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Looking up number:', phone_number);

    // Step 1: Normalize to E.164
    let e164: string;
    try {
      e164 = isValidE164(phone_number) ? phone_number : normalizeToE164(phone_number);
    } catch (error) {
      console.error('E.164 normalization failed:', error.message);
      return new Response(JSON.stringify({
        valid: false,
        error: `Invalid phone format: ${error.message}`,
        e164: null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Normalized to E.164:', e164);

    // Step 2: Call Twilio Lookup API
    const lookupUrl = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164)}?Fields=carrier,caller_name`;
    
    const lookupResponse = await fetch(lookupUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`
      }
    });

    if (!lookupResponse.ok) {
      const errorText = await lookupResponse.text();
      console.error('Twilio Lookup failed:', lookupResponse.status, errorText);
      
      return new Response(JSON.stringify({
        valid: false,
        error: `Twilio Lookup failed: ${lookupResponse.status}`,
        e164
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const lookupData = await lookupResponse.json();
    console.log('Twilio Lookup result:', JSON.stringify(lookupData, null, 2));

    // Step 3: Build result
    const result: LookupResult = {
      e164: lookupData.phone_number,
      countryCode: lookupData.country_code,
      nationalFormat: lookupData.national_format,
      valid: lookupData.valid || false,
      carrier: lookupData.carrier ? {
        type: lookupData.carrier.type,
        name: lookupData.carrier.name
      } : undefined,
      callerName: lookupData.caller_name
    };

    // Step 4: Log to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('analytics_events').insert({
      event_type: 'number_lookup',
      event_data: {
        input: phone_number,
        e164,
        valid: result.valid,
        carrier_type: result.carrier?.type,
        country_code: result.countryCode,
        timestamp: new Date().toISOString()
      },
      severity: result.valid ? 'info' : 'warning'
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in lookup-number:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      valid: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

