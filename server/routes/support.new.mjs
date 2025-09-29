/**
 * Support ticket submission handler with rate limiting and security monitoring
 */
import { z } from 'zod';
import { Resend } from 'resend';

// Rate limiting: Track submissions by IP and email
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_SUBMISSIONS_PER_IP = 3;
const MAX_SUBMISSIONS_PER_EMAIL = 2;

const supportSchema = z.object({
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long')
});

const resend = new Resend(process.env.RESEND_API_KEY);

function isRateLimited(identifier, maxAttempts) {
  const now = Date.now();
  const attempts = rateLimitStore.get(identifier) || [];
  
  // Remove old attempts outside the window
  const validAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validAttempts.length >= maxAttempts) {
    return true;
  }
  
  // Update attempts
  validAttempts.push(now);
  rateLimitStore.set(identifier, validAttempts);
  return false;
}

export async function supportNewHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client IP and User-Agent for security logging
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Validate input
    const { email, subject, message } = supportSchema.parse(req.body);

    // Rate limiting checks
    if (isRateLimited(`ip:${clientIP}`, MAX_SUBMISSIONS_PER_IP)) {
      // Log potential spam attempt
      await logSecurityEvent('support_ticket_rate_limit_ip', {
        ip: clientIP,
        userAgent,
        email: email.substring(0, 3) + '***' // Partially mask email for logging
      }, 'warning');
      
      return res.status(429).json({ 
        error: 'Too many submissions from this IP. Please try again later.' 
      });
    }

    if (isRateLimited(`email:${email}`, MAX_SUBMISSIONS_PER_EMAIL)) {
      // Log potential spam attempt
      await logSecurityEvent('support_ticket_rate_limit_email', {
        ip: clientIP,
        userAgent,
        email: email.substring(0, 3) + '***'
      }, 'warning');
      
      return res.status(429).json({ 
        error: 'Too many submissions from this email. Please try again later.' 
      });
    }

    // Insert into support_tickets table
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: ticket, error: dbError } = await supabase
      .from('support_tickets')
      .insert({ email, subject, message })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Log database error for monitoring
      await logSecurityEvent('support_ticket_db_error', {
        error: dbError.message,
        ip: clientIP
      }, 'error');
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

    // Log successful ticket creation for monitoring
    await logSecurityEvent('support_ticket_created', {
      ticketId: ticket.id,
      ip: clientIP,
      userAgent
    }, 'info');

    // Send email notification
    try {
      await resend.emails.send({
        from: 'TradeLine 24/7 Support <noreply@tradeline247ai.com>',
        to: ['info@tradeline247ai.com'],
        subject: `Support Ticket: ${subject}`,
        html: `
          <h2>New Support Ticket</h2>
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
        `
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the request if email fails
    }

    return res.json({ ok: true, ticketId: ticket.id });

  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (error.name === 'ZodError') {
      // Log validation errors for monitoring
      await logSecurityEvent('support_ticket_validation_error', {
        errors: error.errors,
        ip: clientIP
      }, 'warning');
      
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Support ticket error:', error);
    // Log unexpected errors
    await logSecurityEvent('support_ticket_unexpected_error', {
      error: error.message,
      ip: clientIP
    }, 'error');
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to log security events
async function logSecurityEvent(eventType, eventData, severity = 'info') {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase.from('analytics_events').insert({
      event_type: eventType,
      event_data: eventData,
      severity,
      user_agent: eventData.userAgent,
      ip_address: eventData.ip
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}