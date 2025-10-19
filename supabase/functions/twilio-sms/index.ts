// PROMPT DF-2: Permanent alias /twilio/sms → /functions/v1/webcomms-sms-reply
// Legacy SMS webhook compatibility

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const canonicalUrl = `${supabaseUrl}/functions/v1/webcomms-sms-reply`;
  
  console.log('Legacy /twilio/sms hit - forwarding to /webcomms-sms-reply');
  
  return fetch(canonicalUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
});

