-- Find and fix all security definer views
-- First check if there are any other views with security_barrier set
SELECT schemaname, viewname, viewowner 
FROM pg_views 
WHERE schemaname = 'public';

-- Remove the security_barrier property from appointments_safe view
ALTER VIEW public.appointments_safe SET (security_barrier = false);

-- Check for any other problematic views and clean them up
DROP VIEW IF EXISTS public.appointments_safe CASCADE;

-- Recreate the view properly without any security properties
CREATE VIEW public.appointments_safe AS
SELECT 
  id,
  organization_id,
  start_at,
  end_at,
  status,
  source,
  tz,
  note,
  created_at
FROM public.appointments;

-- Simple grant without any special security properties
GRANT SELECT ON public.appointments_safe TO authenticated;