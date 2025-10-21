import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordCheckRequest {
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const { password }: PasswordCheckRequest = await req.json();
    
    if (!password || typeof password !== 'string') {
      return new Response('Password required', { status: 400, headers: corsHeaders });
    }

    // Never log the actual password
    console.log('Checking password breach status');

    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = new Uint8Array(hashBuffer);
    const sha1 = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    // Use k-anonymity: only send first 5 characters to Have I Been Pwned
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    console.log(`Checking hash prefix: ${prefix}`);

    // Query Have I Been Pwned API with k-anonymity
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Additional privacy protection
        'User-Agent': 'TradeLine247-PasswordCheck/1.0'
      }
    });

    if (!response.ok) {
      console.error('HIBP API error:', response.status);
      // Fail open - if API is down, don't block user signup
      return new Response(JSON.stringify({ 
        isBreached: false, 
        error: 'Password check service temporarily unavailable'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const hashList = await response.text();
    const isBreached = hashList
      .split('\n')
      .some(line => line.startsWith(suffix + ':'));

    if (isBreached) {
      console.log('Password found in breach database');
    } else {
      console.log('Password not found in breach database');
    }

    return new Response(JSON.stringify({ 
      isBreached,
      message: isBreached 
        ? 'This password appears in known data breaches. Please choose a different password.'
        : 'Password is not known to be compromised.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking password breach:', error);
    
    // Fail open - don't block user if there's an error
    return new Response(JSON.stringify({ 
      isBreached: false, 
      error: 'Password check service error'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
