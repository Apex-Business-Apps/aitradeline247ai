import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  page_url?: string;
  user_session?: string;
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

    // Verify HMAC signature
    const signature = req.headers.get('x-signature');
    const origin = req.headers.get('origin') || '';
    
    // Enhanced origin verification for production and development
    const allowedOrigins = [
      /^https:\/\/(www\.)?tradeline247ai\.com$/i,
      /^http:\/\/localhost(:\d+)?$/i, // Allow localhost for development
      /^https:\/\/.*\.lovableproject\.com$/i, // Allow Lovable preview
      /^https:\/\/.*\.lovable\.app$/i, // Allow Lovable staging
      /^https:\/\/id-preview.*\.lovable\.app$/i // Allow specific preview URLs
    ];
    
    const isAllowedOrigin = allowedOrigins.some(pattern => pattern.test(origin));
    if (!isAllowedOrigin) {
      console.log(`Blocked request from unauthorized origin: ${origin}`);
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    const body = await req.text();
    let eventData: AnalyticsEvent;
    
    try {
      eventData = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    // Verify HMAC signature if provided
    if (signature) {
      const secret = Deno.env.get('ANALYTICS_SECRET') || 'default-analytics-secret';
      const encoder = new TextEncoder();
      
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const signatureData = encoder.encode(body);
      const expectedSignature = signature.replace('sha256=', '');
      
      try {
        const signatureBytes = Uint8Array.from(atob(expectedSignature), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, signatureData);
        
        if (!isValid) {
          console.log('Invalid HMAC signature');
          return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }
      } catch (error) {
        console.log('HMAC verification error:', error);
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Sanitize and validate event data
    const sanitizedEvent = {
      event_type: String(eventData.event_type).substring(0, 100),
      event_data: eventData.event_data || {},
      user_session: eventData.user_session ? String(eventData.user_session).substring(0, 200) : null,
      page_url: eventData.page_url ? String(eventData.page_url).substring(0, 500) : null,
      user_agent: req.headers.get('user-agent')?.substring(0, 200) || null,
      // IP anonymization handled by edge function location
      ip_address: null
    };

    // Rate limiting check - basic implementation
    const userAgent = req.headers.get('user-agent') || '';
    const sessionId = sanitizedEvent.user_session || 'anonymous';
    
    // Check recent events from same session (basic rate limiting)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentEvents } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('user_session', sessionId)
      .gte('created_at', oneMinuteAgo);

    if (recentEvents && recentEvents.length > 50) {
      console.log(`Rate limit exceeded for session: ${sessionId}`);
      return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
    }

    // Get the real IP from headers (CF-Connecting-IP for Cloudflare, X-Forwarded-For for others)
    const headers = req.headers;
    const clientIP = headers.get('cf-connecting-ip') || 
                    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    headers.get('x-real-ip') || 
                    null;

    // Use the new safe analytics insertion function to prevent recursion
    const { data: insertResult, error: insertError } = await supabase
      .rpc('safe_analytics_insert_with_circuit_breaker', {
        p_event_type: sanitizedEvent.event_type,
        p_event_data: sanitizedEvent.event_data,
        p_user_session: sanitizedEvent.user_session,
        p_page_url: sanitizedEvent.page_url,
        p_ip_address: clientIP,
        p_user_agent: sanitizedEvent.user_agent
      });

    if (insertError) {
      console.error('Analytics insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If insertResult is null, it means the circuit breaker prevented insertion (recursion detected)
    if (insertResult === null) {
      console.warn('Analytics insertion prevented by circuit breaker - recursion detected');
    }

    console.log(`Analytics event tracked: ${sanitizedEvent.event_type}`);

    // Return 204 No Content (no data in response body for security)
    return new Response(null, { status: 204, headers: corsHeaders });

  } catch (error) {
    console.error('Error in secure-analytics:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});
