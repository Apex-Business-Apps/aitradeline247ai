import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { weeklyDigest } from '../lib/email.templates.mjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM;
const REPLY_TO = process.env.REPLY_TO || 'info@tradeline247ai.com';
const TIMEZONE = process.env.TIMEZONE || 'America/Edmonton';

/**
 * Generate and send weekly operations digest
 * POST /internal/digest/run
 */
export async function internalDigestRunHandler(req, res) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    console.log(`Generating weekly digest: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Fetch metrics from last 7 days
    const metrics = await gatherWeeklyMetrics(startDate, endDate);
    const topMissed = await getTopMissedNumbers(startDate, endDate);
    const newestTranscripts = await getNewestTranscripts(startDate, endDate);
    
    // Generate email content
    const { subject, html, text } = weeklyDigest({
      metrics,
      topMissed,
      newestTranscripts
    });
    
    try {
      // Send digest email
      const emailResult = await resend.emails.send({
        from: EMAIL_FROM,
        to: [REPLY_TO],
        subject,
        html,
        text,
        replyTo: REPLY_TO
      });
      
      console.log('Weekly digest sent successfully:', emailResult.id);
      
      // Log the digest generation
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'weekly_digest_sent',
          event_data: {
            email_id: emailResult.id,
            metrics,
            period: { start: startDate.toISOString(), end: endDate.toISOString() }
          },
          severity: 'info'
        });
      
      return res.json({
        ok: true,
        sent: true,
        metrics,
        emailId: emailResult.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (emailError) {
      console.error('Failed to send digest email:', emailError);
      return res.status(500).json({
        error: 'Failed to send email',
        details: emailError.message,
        metrics // Still return metrics for debugging
      });
    }
    
  } catch (error) {
    console.error('Weekly digest generation failed:', error);
    return res.status(500).json({
      error: 'Digest generation failed',
      message: error.message
    });
  }
}

/**
 * Gather weekly metrics from database
 */
async function gatherWeeklyMetrics(startDate, endDate) {
  try {
    // Get total calls
    const { count: totalCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());
    
    // Get bridged calls (assuming 'bridged' or 'completed' status)
    const { count: bridgedCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .in('status', ['bridged', 'completed', 'answered'])
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());
    
    // Get missed calls
    const { count: missedCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .in('status', ['no-answer', 'missed', 'failed'])
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString());
    
    // Get transcripts count
    const { count: transcriptsDone } = await supabase
      .from('transcripts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    const bridgedPercent = totalCalls > 0 ? Math.round((bridgedCalls / totalCalls) * 100) : 0;
    
    return {
      totalCalls: totalCalls || 0,
      bridgedCalls: bridgedCalls || 0,
      bridgedPercent,
      missedCalls: missedCalls || 0,
      transcriptsDone: transcriptsDone || 0,
      avgRingToBridge: 8 // Placeholder - would need call timing data
    };
    
  } catch (error) {
    console.error('Error gathering metrics:', error);
    return {
      totalCalls: 0,
      bridgedCalls: 0,
      bridgedPercent: 0,
      missedCalls: 0,
      transcriptsDone: 0,
      avgRingToBridge: 0
    };
  }
}

/**
 * Get top 5 missed phone numbers by count
 */
async function getTopMissedNumbers(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('caller_e164')
      .in('status', ['no-answer', 'missed', 'failed'])
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
      .not('caller_e164', 'is', null);
    
    if (error) throw error;
    
    // Count occurrences
    const counts = {};
    data.forEach(call => {
      const e164 = call.caller_e164;
      counts[e164] = (counts[e164] || 0) + 1;
    });
    
    // Sort and get top 5
    return Object.entries(counts)
      .map(([e164, count]) => ({ e164, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
  } catch (error) {
    console.error('Error getting top missed numbers:', error);
    return [];
  }
}

/**
 * Get newest 10 transcripts
 */
async function getNewestTranscripts(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('transcripts')
      .select(`
        created_at,
        call_sid,
        calls!inner(caller_e164)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return data.map(transcript => ({
      from: transcript.calls?.caller_e164 || 'Unknown',
      to: 'TradeLine 24/7',
      time: transcript.created_at
    }));
    
  } catch (error) {
    console.error('Error getting newest transcripts:', error);
    return [];
  }
}