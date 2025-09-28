import { verify } from '../lib/signer.mjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Handle email CTA resolve - mark call as resolved
 * GET /a/r?t=<token>
 */
export async function emailCtaResolveHandler(req, res) {
  try {
    const { t: token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    // Verify and decode token
    let payload;
    try {
      payload = verify(token);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    const { callSid, toE164 } = payload;
    
    if (!callSid || !toE164) {
      return res.status(400).json({ error: 'Invalid token payload' });
    }
    
    try {
      // Mark call as resolved in the calls table (best-effort upsert)
      const { error: updateError } = await supabase
        .from('calls')
        .upsert({
          call_sid: callSid,
          status: 'resolved',
          outcome: 'resolved_via_email'
        }, {
          onConflict: 'call_sid'
        });
      
      if (updateError) {
        console.warn('Failed to update call status:', updateError);
        // Don't fail the request, just log the issue
      }
      
      // Log the resolve action
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'email_cta_resolve',
          event_data: {
            call_sid: callSid,
            to_e164: toE164,
            timestamp: new Date().toISOString()
          },
          severity: 'info'
        });
      
      console.log(`Call ${callSid} marked as resolved via email CTA`);
      
      return res.json({
        ok: true,
        resolved: true,
        callSid
      });
      
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Return success anyway since this is best-effort
      return res.json({
        ok: true,
        resolved: true,
        callSid,
        note: 'Marked resolved (database update failed)'
      });
    }
    
  } catch (error) {
    console.error('Email CTA resolve error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}