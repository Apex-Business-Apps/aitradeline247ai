// PROMPT DF-2: Permanent alias /twilio/sms-status → /functions/v1/webcomms-sms-status
// Legacy SMS status callback compatibility

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const canonicalUrl = `${supabaseUrl}/functions/v1/webcomms-sms-status`;
  
  console.log('Legacy /twilio/sms-status hit - forwarding to /webcomms-sms-status');
  
  return fetch(canonicalUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
});
