-- AUDIT CLEANUP: Remove unused MVP tables that are no longer needed
-- These tables were from an earlier MVP implementation and are empty with no dependencies

-- Drop MVP tables (verified as empty and unused)
DROP TABLE IF EXISTS public.mvp_dlq CASCADE;
DROP TABLE IF EXISTS public.mvp_inbox_events CASCADE; 
DROP TABLE IF EXISTS public.mvp_jobs CASCADE;

-- Add audit logging for cleanup action
SELECT public.log_security_event(
  'database_cleanup_performed',
  NULL,
  NULL,
  '{"tables_removed": ["mvp_dlq", "mvp_inbox_events", "mvp_jobs"], "reason": "unused_mvp_tables", "verified_empty": true}'::jsonb,
  'info'
);