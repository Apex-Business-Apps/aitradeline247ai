-- ============================================================================
-- SECURITY FIX: A/B Test Data Protection & Enhanced Security
-- ============================================================================
-- This migration addresses CRITICAL security vulnerabilities:
-- 1. A/B test assignment exposure (anyone can view/modify)
-- 2. A/B test configuration exposure (publicly readable)
-- 3. Adds audit logging and enhanced monitoring
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: Fix ab_test_assignments RLS Policies (CRITICAL)
-- ----------------------------------------------------------------------------

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.ab_test_assignments;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON public.ab_test_assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON public.ab_test_assignments;

-- Create secure, session-based policies
CREATE POLICY "Users can view only their session assignments"
ON public.ab_test_assignments
FOR SELECT
USING (
  user_session = current_setting('request.cookies', true)::json->>'anon_id'
  OR auth.uid() IS NOT NULL AND user_session = auth.uid()::text
);

CREATE POLICY "Service role can insert assignments"
ON public.ab_test_assignments
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update assignments"
ON public.ab_test_assignments
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- PART 2: Fix ab_tests Configuration Access (CRITICAL)
-- ----------------------------------------------------------------------------

-- Drop public read access
DROP POLICY IF EXISTS "Anyone can view active ab_tests" ON public.ab_tests;

-- Restrict to admins and service role only
CREATE POLICY "Only admins can view ab_tests"
ON public.ab_tests
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ----------------------------------------------------------------------------
-- PART 3: Create Security Definer Function for Safe Variant Access
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_variant_display_data(
  p_test_name text,
  p_variant text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant_data jsonb;
BEGIN
  -- Only return the specific variant's display data, NOT full config
  SELECT variants->p_variant INTO v_variant_data
  FROM public.ab_tests
  WHERE test_name = p_test_name
    AND active = true;
  
  -- Return only safe display properties
  RETURN jsonb_build_object(
    'text', COALESCE(v_variant_data->>'text', 'Grow Now'),
    'color', COALESCE(v_variant_data->>'color', 'primary'),
    'variant', p_variant
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- PART 4: Add Security Audit Logging Function
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_ab_test_access(
  p_test_name text,
  p_variant text,
  p_access_type text DEFAULT 'assignment'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    severity
  ) VALUES (
    'ab_test_access',
    jsonb_build_object(
      'test_name', p_test_name,
      'variant', p_variant,
      'access_type', p_access_type,
      'timestamp', NOW()
    ),
    'info'
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- PART 5: Enhanced Service Role Validation for Analytics
-- ----------------------------------------------------------------------------

-- Add validation to analytics_events service role policy
DROP POLICY IF EXISTS "Service role can manage analytics events" ON public.analytics_events;

CREATE POLICY "Service role can manage analytics events with validation"
ON public.analytics_events
FOR ALL
USING (
  auth.role() = 'service_role'
  AND (
    -- Validate that event_type is from allowed list
    event_type IN (
      'page_view', 'web_vital', 'error', 'ab_test_conversion',
      'ab_test_access', 'security_event', 'auth_attempt',
      'concurrent_sessions_detected', 'suspicious_activity'
    )
    OR event_type LIKE 'custom_%'
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  AND event_type IS NOT NULL
);

-- ----------------------------------------------------------------------------
-- PART 6: Add Rate Limiting Table for Support Tickets
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.support_ticket_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- email or IP
  identifier_type text NOT NULL, -- 'email' or 'ip'
  ticket_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, identifier_type, window_start)
);

-- Enable RLS
ALTER TABLE public.support_ticket_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role can manage rate limits"
ON public.support_ticket_rate_limits
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete rate limit records older than 1 hour
  DELETE FROM public.support_ticket_rate_limits
  WHERE window_start < (NOW() - INTERVAL '1 hour');
END;
$$;

-- ----------------------------------------------------------------------------
-- SUCCESS: Security fixes applied
-- ----------------------------------------------------------------------------
-- Summary:
-- ✅ ab_test_assignments: Session-based access only
-- ✅ ab_tests: Admin and service role only
-- ✅ New secure function: get_variant_display_data()
-- ✅ Audit logging: log_ab_test_access()
-- ✅ Enhanced analytics validation
-- ✅ Rate limiting infrastructure for support tickets
-- ----------------------------------------------------------------------------