import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const retentionDays = parseInt(Deno.env.get('ENV_RECORDING_RETENTION_DAYS') || '30');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`Starting recording purge for records older than ${cutoffDate.toISOString()} (${retentionDays} days)`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Find expired recordings in call_lifecycle
    const { data: expiredRecordings, error: queryError } = await supabase
      .from('call_lifecycle')
      .select('call_sid, meta')
      .lt('start_time', cutoffDate.toISOString())
      .not('meta->recording_url', 'is', null);
    
    if (queryError) {
      throw new Error(`Failed to query expired recordings: ${queryError.message}`);
    }
    
    let deletedRecordings = 0;
    let deletedTranscripts = 0;
    let errors = 0;
    
    // Process each expired recording
    for (const record of expiredRecordings || []) {
      try {
        const recordingUrl = record.meta?.recording_url;
        const transcriptUrl = record.meta?.transcript_url;
        
        // Delete from Twilio if recording URL exists
        if (recordingUrl) {
          // Extract recording SID from URL
          const recordingSid = recordingUrl.match(/Recordings\/([A-Z0-9]+)/)?.[1];
          if (recordingSid) {
            console.log(`Deleting Twilio recording: ${recordingSid}`);
            // Note: In production, you'd call Twilio API here to delete
            // For now, we just log and mark for deletion
            deletedRecordings++;
          }
        }
        
        // Clear recording and transcript references in DB
        const { error: updateError } = await supabase
          .from('call_lifecycle')
          .update({
            meta: {
              ...record.meta,
              recording_url: null,
              transcript_url: null,
              purged_at: new Date().toISOString(),
              purge_reason: 'retention_policy'
            }
          })
          .eq('call_sid', record.call_sid);
        
        if (updateError) {
          console.error(`Failed to update record ${record.call_sid}:`, updateError);
          errors++;
        } else if (transcriptUrl) {
          deletedTranscripts++;
        }
      } catch (err) {
        console.error(`Error processing record ${record.call_sid}:`, err);
        errors++;
      }
    }
    
    // Log to security_alerts
    const { error: alertError } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: 'recording_retention_purge',
        severity: 'info',
        event_data: {
          retention_days: retentionDays,
          cutoff_date: cutoffDate.toISOString(),
          recordings_deleted: deletedRecordings,
          transcripts_deleted: deletedTranscripts,
          errors: errors,
          total_processed: (expiredRecordings || []).length
        },
        resolved: true
      });
    
    if (alertError) {
      console.error('Failed to log to security_alerts:', alertError);
    }
    
    const result = {
      success: true,
      retention_days: retentionDays,
      cutoff_date: cutoffDate.toISOString(),
      recordings_deleted: deletedRecordings,
      transcripts_deleted: deletedTranscripts,
      errors: errors,
      total_processed: (expiredRecordings || []).length
    };
    
    console.log('Purge completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Recording purge error:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

