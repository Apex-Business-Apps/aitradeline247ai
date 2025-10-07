import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (production would use Redis)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in ms
const RATE_LIMIT_MAX = 3; // 3 submissions per hour

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = rateLimits.get(identifier);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  
  limit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - limit.count };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '');
    
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    // Check rate limit
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      console.warn(`Rate limit exceeded for ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          remaining: 0
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs (basic)
    const sanitizedData = {
      name: String(name).trim().slice(0, 100),
      email: String(email).trim().toLowerCase().slice(0, 255),
      phone: phone ? String(phone).trim().slice(0, 20) : null,
      subject: subject ? String(subject).trim().slice(0, 200) : 'New Contact Form Submission',
      message: String(message).trim().slice(0, 2000),
      ip_address: clientIp,
      user_agent: req.headers.get('user-agent')?.slice(0, 500) || null
    };

    // Insert into database
    const { data: contactRecord, error: dbError } = await supabaseClient
      .from('contact_messages')
      .insert(sanitizedData)
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save contact message');
    }

    console.log(`Contact message saved: ${contactRecord.id}`);

    // Send notification email via Resend
    try {
      const notifyEmail = await resend.emails.send({
        from: Deno.env.get('FROM_EMAIL') || 'notifications@tradeline247ai.com',
        to: [Deno.env.get('NOTIFY_TO') || 'info@tradeline247ai.com'],
        subject: `New Contact: ${sanitizedData.subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${sanitizedData.name} (${sanitizedData.email})</p>
          ${sanitizedData.phone ? `<p><strong>Phone:</strong> ${sanitizedData.phone}</p>` : ''}
          <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
          <p><strong>Message:</strong></p>
          <p>${sanitizedData.message}</p>
          <hr>
          <p><small>IP: ${clientIp} | Submitted: ${new Date().toISOString()}</small></p>
        `
      });

      console.log('Notification email sent:', notifyEmail.id);

      // Send auto-reply to customer
      const autoReply = await resend.emails.send({
        from: Deno.env.get('FROM_EMAIL') || 'notifications@tradeline247ai.com',
        to: [sanitizedData.email],
        subject: 'We received your message - TradeLine 24/7',
        html: `
          <h2>Thanks for reaching out, ${sanitizedData.name}!</h2>
          <p>We've received your message and will get back to you within 2 hours during business hours.</p>
          <p>In the meantime, feel free to call us at <strong>587-742-8885</strong> if you need immediate assistance.</p>
          <br>
          <p>Best regards,<br>The TradeLine 24/7 Team</p>
        `
      });

      console.log('Auto-reply sent:', autoReply.id);
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the request if email fails - message is saved
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: contactRecord.id,
        remaining: rateCheck.remaining
      }),
      { 
        status: 202, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Contact submission error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});