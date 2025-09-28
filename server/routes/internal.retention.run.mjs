import { supabase } from '../lib/supabaseClient.mjs';

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

      // Default retention policies (should come from org settings in production)
      const retentionPolicies = {
        email_logs_days: 90,
        transcripts_days: 365,
        recordings_days: 30
      };

      // Clean old email logs (if table exists)
      const emailCutoff = new Date();
      emailCutoff.setDate(emailCutoff.getDate() - retentionPolicies.email_logs_days);
      
      if (!isDryRun) {
        // This would delete actual records
        // const { count: emailCount } = await supabase
        //   .from('email_logs')
        //   .delete()
        //   .lt('created_at', emailCutoff.toISOString());
        // summary.email_logs_deleted = emailCount || 0;
      } else {
        // Dry run - just count what would be deleted
        summary.email_logs_deleted = 0; // Would query count here
      }

      // Clean old transcripts (soft delete)
      const transcriptCutoff = new Date();
      transcriptCutoff.setDate(transcriptCutoff.getDate() - retentionPolicies.transcripts_days);
      
      if (!isDryRun) {
        const { count: transcriptCount } = await supabase
          .from('transcripts')
          .update({ content: '[REDACTED - RETENTION POLICY]' })
          .lt('created_at', transcriptCutoff.toISOString());
        summary.transcripts_deleted = transcriptCount || 0;
      }

      // Note: Twilio recording deletion would require API calls
      // This is handled separately if TWILIO_ACCOUNT_SID is present

      res.json({
        ok: true,
        summary,
        retention_policies: retentionPolicies,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('Retention job error:', err);
      res.status(500).json({ error: 'Retention job failed' });
    }
  });
  
  console.log('✅ Retention job wired at /internal/retention/run');
}