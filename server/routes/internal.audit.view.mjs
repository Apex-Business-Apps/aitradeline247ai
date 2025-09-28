import { supabase } from '../lib/supabaseClient.mjs';

/**
 * Internal audit viewer - GET /internal/audit/recent
 * Query params: org_id, limit (default 50)
 */
export function wireAuditViewer(app) {
  app.get('/internal/audit/recent', async (req, res) => {
    try {
      const { org_id, limit = 50 } = req.query;
      
      let query = supabase
        .from('analytics_events')
        .select('*')
        .like('event_type', 'audit.%')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (org_id) {
        query = query.eq('event_data->org_id', org_id);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ 
        ok: true, 
        events: data || [],
        count: data?.length || 0 
      });
    } catch (err) {
      console.error('Audit viewer error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  console.log('✅ Audit viewer wired at /internal/audit/recent');
}