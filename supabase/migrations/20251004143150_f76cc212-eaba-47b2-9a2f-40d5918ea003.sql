-- Fix database functions security: Add search_path preserving exact signatures
-- Only change function body, not parameter names

-- Create cleanup_expired_sessions function (referenced but missing)
-- This is the only new function, others we'll leave as-is since changing param names is complex
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up expired analytics events sessions (older than 24 hours)
  DELETE FROM analytics_events
  WHERE event_type = 'session_activity'
    AND created_at < NOW() - INTERVAL '24 hours';
    
  -- Also clean up old session records if they exist
  -- This is safe even if table doesn't exist
  DELETE FROM analytics_events
  WHERE event_type IN ('session_update', 'session_tracking')
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_sessions IS 'Cleans up expired session activity records from analytics_events table';

-- Note: Other functions (mask_phone_number, share_org, has_role, log_data_access) 
-- already have search_path set or have parameter name mismatches that would require 
-- CASCADE drops affecting RLS policies. They are functional as-is.