import { createClient } from '@supabase/supabase-js';
import Twilio from 'twilio';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hysvqdwmhxnblxfqnszn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Data retention job - POST /internal/retention/run
 * Query params: dry=1 for dry-run mode
 */
export function wireRetention(app) {
  app.post('/internal/retention/run', async (req, res) => {
    try {
      const isDryRun = req.query.dry === '1';
      const summary = {
        email_logs_deleted: 0,
        transcripts_deleted: 0,
        recordings_deleted: 0,
        dry_run: isDryRun
      };

      // Get all retention policies
      const { data: policies } = await supabase
        .from('retention_policies')
        .select('*');

      if (!policies || policies.length === 0) {
        return res.json({
          ok: true,
          message: 'No retention policies found',
          summary
        });
      }

      for (const policy of policies) {
        // Clean old transcripts (soft delete)
        const transcriptCutoff = new Date();
        transcriptCutoff.setDate(transcriptCutoff.getDate() - policy.transcripts_days);
        
        if (!isDryRun) {
          const { count: transcriptCount } = await supabase
            .from('transcripts')
            .update({ content: '[REDACTED - RETENTION POLICY]' })
            .eq('org_id', policy.org_id)
            .lt('created_at', transcriptCutoff.toISOString());
          summary.transcripts_deleted += transcriptCount || 0;
        }

        // Delete Twilio recordings if credentials available
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
          const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          const recordingCutoff = new Date();
          recordingCutoff.setDate(recordingCutoff.getDate() - policy.recordings_days);
          
          if (!isDryRun) {
            try {
              const recordings = await client.recordings.list({
                dateCreatedBefore: recordingCutoff,
                limit: 100
              });
              
              for (const recording of recordings) {
                await recording.remove();
                summary.recordings_deleted++;
              }
            } catch (twilioError) {
              console.error('Twilio recording cleanup failed:', twilioError);
            }
          }
        }

        // Email logs cleanup would go here if table exists
        // This is a placeholder for future email_logs table
        const emailCutoff = new Date();
        emailCutoff.setDate(emailCutoff.getDate() - policy.email_logs_days);
        
        if (!isDryRun) {
          // Placeholder for email_logs cleanup
          // const { count: emailCount } = await supabase
          //   .from('email_logs')  
          //   .delete()
          //   .eq('org_id', policy.org_id)
          //   .lt('created_at', emailCutoff.toISOString());
          // summary.email_logs_deleted += emailCount || 0;
        }
      }

      res.json({
        ok: true,
        summary,
        policies_processed: policies.length,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('Retention job error:', err);
      res.status(500).json({ error: 'Retention job failed' });
    }
  });
  
  console.log('✅ Retention job wired at /internal/retention/run');
}