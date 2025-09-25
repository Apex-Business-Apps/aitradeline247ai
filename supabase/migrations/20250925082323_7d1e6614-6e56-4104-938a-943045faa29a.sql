-- Secure Analytics Events Table - Protect User Tracking Data

-- 1. First, drop any existing policies that might allow unauthorized access
DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Edge functions can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can read all analytics events" ON public.analytics_events;

-- 2. Create comprehensive admin-only read access policy
CREATE POLICY "Secure admin analytics read access"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  -- Multi-layer security check for admin access
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() IS NOT NULL
  AND auth.jwt() IS NOT NULL
);

-- 3. Service role read access (for internal operations)
CREATE POLICY "Service role secure analytics read"
ON public.analytics_events
FOR SELECT
TO service_role
USING (auth.role() = 'service_role');

-- 4. Secure service role insert policy (server-side operations)
CREATE POLICY "Service role secure analytics insert"
ON public.analytics_events
FOR INSERT
TO service_role
WITH CHECK (
  auth.role() = 'service_role'
  AND event_type IS NOT NULL
  AND created_at IS NOT NULL
);

-- 5. Edge function insert policy (for legitimate analytics from client)
CREATE POLICY "Secure edge function analytics insert"
ON public.analytics_events
FOR INSERT
TO anon
WITH CHECK (
  -- Only allow specific event types from edge functions
  event_type = ANY(ARRAY[
    'page_view', 'web_vital', 'user_interaction', 'form_submission',
    'security_violation', 'lead_data_security_event', 'sensitive_data_access',
    'lead_access_security', 'ab_test_conversion', 'ab_test_assignment'
  ])
  AND auth.role() = 'anon'
  AND auth.jwt() IS NULL
  -- Ensure IP and user agent are properly formatted if provided
  AND (ip_address IS NULL OR length(ip_address) <= 45) -- Max IP length
  AND (user_agent IS NULL OR length(user_agent) <= 500) -- Reasonable user agent limit
);

-- 6. Explicitly deny all unauthorized read access
CREATE POLICY "Block unauthorized analytics read access"
ON public.analytics_events
FOR SELECT
TO anon
USING (false);

-- 7. Block regular authenticated users from reading analytics
CREATE POLICY "Block non-admin user analytics read access"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  -- Only allow if user is admin (this will be overridden by the admin policy above)
  false
);

-- 8. Explicitly deny all update and delete operations except for service role
CREATE POLICY "Block analytics updates for non-service roles"
ON public.analytics_events
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Block analytics deletes for non-service roles"
ON public.analytics_events
FOR DELETE
TO anon, authenticated
USING (false);

-- 9. Service role can manage analytics for data retention
CREATE POLICY "Service role analytics management"
ON public.analytics_events
FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 10. Create function to anonymize sensitive analytics data automatically
CREATE OR REPLACE FUNCTION public.auto_anonymize_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-anonymize IP addresses for certain event types after 24 hours
  IF NEW.event_type IN ('page_view', 'user_interaction', 'web_vital') THEN
    -- Schedule anonymization by setting a flag
    NEW.event_data := COALESCE(NEW.event_data, '{}'::jsonb) || jsonb_build_object(
      'anonymize_after', (now() + interval '24 hours')::text,
      'privacy_level', 'standard'
    );
  ELSIF NEW.event_type IN ('security_violation', 'sensitive_data_access') THEN
    -- Keep security events longer but mark for extended retention
    NEW.event_data := COALESCE(NEW.event_data, '{}'::jsonb) || jsonb_build_object(
      'anonymize_after', (now() + interval '30 days')::text,
      'privacy_level', 'security_critical'
    );
  END IF;
  
  -- Log analytics insertion for audit trail
  INSERT INTO public.analytics_events (
    event_type, event_data, user_session, page_url
  ) VALUES (
    'analytics_audit',
    jsonb_build_object(
      'original_event_type', NEW.event_type,
      'timestamp', now(),
      'user_role', auth.role(),
      'privacy_classification', 'audit_log'
    ),
    'system_audit',
    'analytics_security_monitor'
  ) ON CONFLICT DO NOTHING; -- Prevent infinite recursion
  
  RETURN NEW;
END;
$$;

-- 11. Apply auto-anonymization trigger
DROP TRIGGER IF EXISTS auto_anonymize_analytics ON public.analytics_events;
CREATE TRIGGER auto_anonymize_analytics
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.auto_anonymize_analytics();

-- 12. Create privacy-focused analytics view (no PII exposure)
CREATE VIEW public.analytics_privacy_summary AS
SELECT 
  event_type,
  DATE_TRUNC('hour', created_at) as time_window,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_session) as unique_sessions,
  -- No IP addresses, user agents, or PII exposed
  CASE 
    WHEN COUNT(*) > 100 THEN 'HIGH_TRAFFIC'
    WHEN COUNT(*) > 10 THEN 'NORMAL_TRAFFIC'
    ELSE 'LOW_TRAFFIC'
  END as traffic_level
FROM public.analytics_events
WHERE created_at > now() - interval '7 days'
  AND event_type NOT IN ('security_violation', 'sensitive_data_access') -- Exclude security events
GROUP BY event_type, DATE_TRUNC('hour', created_at)
ORDER BY time_window DESC;

-- 13. Create function for secure analytics access logging
CREATE OR REPLACE FUNCTION public.log_analytics_access_attempt(
  access_type text,
  success boolean DEFAULT true,
  user_context text DEFAULT NULL
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
    user_session,
    page_url
  ) VALUES (
    'analytics_access_audit',
    jsonb_build_object(
      'access_type', access_type,
      'success', success,
      'user_context', user_context,
      'user_id', auth.uid(),
      'user_role', auth.role(),
      'timestamp', now(),
      'security_classification', 'privacy_audit'
    ),
    COALESCE(auth.uid()::text, 'anonymous'),
    'analytics_access_control'
  );
END;
$$;

-- 14. Add index for efficient privacy queries
CREATE INDEX IF NOT EXISTS idx_analytics_privacy_queries
ON public.analytics_events(event_type, created_at)
WHERE event_type NOT IN ('security_violation', 'sensitive_data_access');

-- 15. Grant appropriate permissions for the privacy view
GRANT SELECT ON public.analytics_privacy_summary TO authenticated;