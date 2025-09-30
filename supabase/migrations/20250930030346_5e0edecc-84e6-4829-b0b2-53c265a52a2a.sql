
-- Clean up duplicate and redundant tables
-- This migration removes unused duplicate organization and membership tables

-- Drop org_users table (duplicate of organization_members, empty)
DROP TABLE IF EXISTS public.org_users CASCADE;

-- Drop orgs table (duplicate of organizations, empty)
DROP TABLE IF EXISTS public.orgs CASCADE;

-- Log the cleanup
INSERT INTO public.analytics_events (
  event_type,
  event_data,
  severity
) VALUES (
  'database_cleanup',
  jsonb_build_object(
    'action', 'removed_duplicate_tables',
    'tables_removed', jsonb_build_array('orgs', 'org_users'),
    'timestamp', NOW()
  ),
  'info'
);
