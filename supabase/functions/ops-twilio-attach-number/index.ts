// supabase edge function (Deno)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN  = Deno.env.get("TWILIO_AUTH_TOKEN")!;

const BASE = "https://api.twilio.com/2010-04-01";
const VOICE_URL       = "https://api.tradeline247ai.com/functions/v1/voice-answer";
const VOICE_STATUS    = "https://api.tradeline247ai.com/functions/v1/voice-status";
const SMS_URL         = "https://api.tradeline247ai.com/functions/v1/webcomms-sms-reply";
const SMS_STATUS      = "https://api.tradeline247ai.com/functions/v1/webcomms-sms-status";

function tw(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`));
  return fetch(`${BASE}${path}`, { ...init, headers });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { number_e164 } = await req.json();
    
    // Smoke test hook (non-production only)
    if (number_e164 === "SMOKE_TEST") {
      if (Deno.env.get("ENV") === "production") {
        return new Response(JSON.stringify({ ok: false, error: "Invalid E.164 number" }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      console.log("🧪 Smoke test invoked");
      return new Response(JSON.stringify({ ok: true, number: "SMOKE_TEST", phone_sid: "PN_SMOKE" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200
      });
    }
    
    // Validate E.164 format
    if (!number_e164 || !/^\+\d{8,15}$/.test(number_e164)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid E.164 number" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`🔍 Searching for number: ${number_e164}`);

    // 1) Find the phone SID by number (parent account)
    const searchResp = await tw(`/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(number_e164)}`);
    const searchJson = await searchResp.json();
    const hit = searchJson?.incoming_phone_numbers?.[0];
    
    if (!hit?.sid) {
      console.error(`❌ Number not found: ${number_e164}`);
      return new Response(JSON.stringify({ ok: false, error: "number_not_found" }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const phoneSid = hit.sid;
    console.log(`✅ Found number SID: ${phoneSid}`);

    // 2) Update webhooks on that number
    const form = new URLSearchParams({
      VoiceUrl: VOICE_URL,
      VoiceMethod: "POST",
      StatusCallback: VOICE_STATUS,
      StatusCallbackMethod: "POST",
      SmsUrl: SMS_URL,
      SmsMethod: "POST",
      SmsStatusCallback: SMS_STATUS
    });
    
    console.log(`🔧 Updating webhooks for ${phoneSid}...`);
    const upd = await tw(`/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${phoneSid}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form
    });
    const updJson = await upd.json();
    
    if (!upd.ok) {
      console.error(`❌ Update failed:`, updJson);
      return new Response(JSON.stringify({ ok: false, error: updJson?.message || "Update failed" }), { 
        status: upd.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`✅ Webhooks updated successfully for ${number_e164}`);
    return new Response(JSON.stringify({ ok: true, number: number_e164, phone_sid: phoneSid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 200
    });
  } catch (e) {
    console.error(`❌ Exception:`, e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 500
    });
  }
});
