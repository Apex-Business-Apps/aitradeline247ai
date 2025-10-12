-- Enable extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule pre-warm cron job (every 5 minutes)
-- Hits critical endpoints to prevent cold starts
SELECT cron.schedule(
  'prewarm-functions',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/prewarm-cron',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo"}'::jsonb,
      body := jsonb_build_object('timestamp', now()::text, 'trigger', 'cron')
    ) as request_id;
  $$
);

-- Schedule daily performance rollup (runs at 2 AM UTC)
-- Aggregates metrics from function logs into analytics_events
SELECT cron.schedule(
  'daily-performance-rollup',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  INSERT INTO public.analytics_events (event_type, event_data, severity)
  SELECT 
    'daily_performance_rollup',
    jsonb_build_object(
      'date', CURRENT_DATE - INTERVAL '1 day',
      'summary', jsonb_agg(
        jsonb_build_object(
          'event_type', event_type,
          'count', count,
          'p50_severity', p50_severity
        )
      )
    ),
    'info'
  FROM (
    SELECT 
      event_type,
      COUNT(*) as count,
      mode() WITHIN GROUP (ORDER BY severity) as p50_severity
    FROM public.analytics_events
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
      AND created_at < CURRENT_DATE
      AND event_type != 'daily_performance_rollup'
    GROUP BY event_type
  ) daily_stats
  WHERE count > 0;
  $$
);

-- Add index for cron job queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_type 
ON public.analytics_events(created_at DESC, event_type) 
WHERE event_type != 'daily_performance_rollup';

-- View cron job status
COMMENT ON EXTENSION pg_cron IS 'Pre-warm functions every 5 minutes to prevent cold starts';

-- Grant permissions for cron jobs
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;