// PROMPT DF-1: Permanent alias /twilio/status → /functions/v1/voice-status
// Legacy voice status callback compatibility

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const canonicalUrl = `${supabaseUrl}/functions/v1/voice-status`;
  
  console.log('Legacy /twilio/status hit - forwarding to /voice-status');
  
  return fetch(canonicalUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
});

