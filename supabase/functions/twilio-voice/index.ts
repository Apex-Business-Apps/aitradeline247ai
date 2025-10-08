// PROMPT DF-1: Permanent alias /twilio/voice → /functions/v1/voice-answer
// This ensures legacy links never break while new numbers use canonical path

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Forward all requests to canonical voice-answer endpoint
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const canonicalUrl = `${supabaseUrl}/functions/v1/voice-answer`;
  
  console.log('Legacy /twilio/voice hit - forwarding to /voice-answer');
  
  return fetch(canonicalUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
});
