/**
 * Support ticket submission handler
 */
import { z } from 'zod';
import { Resend } from 'resend';

const supportSchema = z.object({
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long')
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function supportNewHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate input
    const { email, subject, message } = supportSchema.parse(req.body);

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
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

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
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Support ticket error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}