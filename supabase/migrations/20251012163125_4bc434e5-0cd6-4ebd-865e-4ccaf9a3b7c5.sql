-- Schedule daily recording purge for PIPEDA compliance
-- Runs at 3 AM UTC every day to purge recordings beyond retention period

SELECT cron.schedule(
  'recording-retention-purge',
  '0 3 * * *',  -- Daily at 3 AM UTC
  $$
  SELECT
    net.http_post(
      url:='https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/recording-purge',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo"}'::jsonb
    ) as request_id;
  $$
);