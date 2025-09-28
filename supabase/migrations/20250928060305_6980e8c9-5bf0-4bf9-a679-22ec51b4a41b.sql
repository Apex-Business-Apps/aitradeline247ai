-- Fix Security Definer View issue by replacing view with a secure function

-- Drop the existing view
DROP VIEW IF EXISTS public.v_latest_consent;

-- Create a SECURITY INVOKER function instead of a view
-- This ensures proper RLS and permission checking
CREATE OR REPLACE FUNCTION public.get_latest_consent_status(p_e164 text DEFAULT NULL, p_channel text DEFAULT NULL)
RETURNS TABLE (
  e164 text,
  channel text, 
  status text,
  last_change_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER -- Uses caller's permissions, not function owner's
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (cl.e164, cl.channel)
    cl.e164,
    cl.channel,
    cl.status,
    cl.created_at AS last_change_at
  FROM public.consent_logs cl
  WHERE (p_e164 IS NULL OR cl.e164 = p_e164)
    AND (p_channel IS NULL OR cl.channel = p_channel)
  ORDER BY cl.e164, cl.channel, cl.created_at DESC;
$$;

-- Add proper access control comment
COMMENT ON FUNCTION public.get_latest_consent_status(text, text) IS 'Returns latest consent status. Uses SECURITY INVOKER to respect caller permissions and RLS policies on consent_logs table.';

-- Ensure the underlying consent_logs table has proper RLS (it should already have service role policies)
-- This is just a verification that RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consent_logs') THEN
    ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;