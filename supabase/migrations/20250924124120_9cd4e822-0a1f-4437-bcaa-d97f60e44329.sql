-- Fix analytics_events_public security exposure
-- The view cannot have RLS policies, so we'll drop it entirely to prevent data exposure

-- Drop the existing public view that exposes sensitive analytics data
DROP VIEW IF EXISTS public.analytics_events_public;

-- Add comment explaining why the view was removed
-- If aggregated analytics data is needed publicly, it should be accessed through a secure API endpoint with proper authentication
COMMENT ON TABLE public.analytics_events IS 'Analytics events table with proper RLS policies. The analytics_events_public view was removed due to security concerns - all analytics data access should go through proper authentication channels';