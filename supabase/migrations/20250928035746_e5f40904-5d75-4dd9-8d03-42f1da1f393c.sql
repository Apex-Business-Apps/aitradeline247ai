-- Security Enhancement: Restrict profile data sharing and add enhanced monitoring
-- 1. More restrictive profile sharing - remove cross-org visibility unless explicitly needed
DROP POLICY IF EXISTS "profiles_select_same_org" ON public.profiles;

-- Create more granular profile access control
CREATE POLICY "profiles_select_own_org_admins" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() OR 
  (has_role(auth.uid(), 'admin'::app_role) AND share_org(auth.uid(), id))
);

-- 2. Add data retention policy for analytics events
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete analytics events older than 90 days that contain potential PII
  DELETE FROM public.analytics_events 
  WHERE created_at < (NOW() - INTERVAL '90 days')
  AND (
    event_data ? 'email' OR 
    event_data ? 'phone' OR 
    event_data ? 'name' OR
    event_data ? 'user_id'
  );
  
  -- Log the cleanup operation
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    severity
  ) VALUES (
    'data_retention_cleanup',
    jsonb_build_object(
      'action', 'cleanup_analytics_events',
      'timestamp', NOW()
    ),
    'info'
  );
END;
$$;

-- 3. Enhanced monitoring: Failed authentication attempts
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  user_id uuid,
  ip_address inet,
  user_agent text,
  event_data jsonb DEFAULT '{}',
  severity text DEFAULT 'medium',
  resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can view security alerts
CREATE POLICY "Admins can view security alerts" 
ON public.security_alerts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage security alerts" 
ON public.security_alerts 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 4. Function to detect and log suspicious authentication patterns
CREATE OR REPLACE FUNCTION public.detect_auth_anomalies(
  p_user_id uuid,
  p_ip_address inet,
  p_user_agent text,
  p_event_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_failures integer;
  v_geo_anomaly boolean := false;
  v_device_anomaly boolean := false;
BEGIN
  -- Check for excessive failed login attempts (>5 in 15 minutes)
  IF p_event_type = 'auth_failed' THEN
    SELECT COUNT(*) INTO v_recent_failures
    FROM public.analytics_events
    WHERE event_type = 'auth_failed'
    AND ip_address = p_ip_address
    AND created_at > (NOW() - INTERVAL '15 minutes');
    
    IF v_recent_failures >= 5 THEN
      INSERT INTO public.security_alerts (
        alert_type,
        user_id,
        ip_address,
        user_agent,
        event_data,
        severity
      ) VALUES (
        'excessive_failed_auth',
        p_user_id,
        p_ip_address,
        p_user_agent,
        jsonb_build_object(
          'failure_count', v_recent_failures,
          'time_window', '15 minutes'
        ),
        'high'
      );
    END IF;
  END IF;
  
  -- Check for admin login from new location (simplified check)
  IF p_event_type = 'admin_login' AND p_user_id IS NOT NULL THEN
    -- Check if this IP has been used by this admin before
    SELECT NOT EXISTS (
      SELECT 1 FROM public.analytics_events
      WHERE event_type = 'admin_login'
      AND user_id = p_user_id
      AND ip_address = p_ip_address
      AND created_at < (NOW() - INTERVAL '1 hour')
    ) INTO v_geo_anomaly;
    
    IF v_geo_anomaly THEN
      INSERT INTO public.security_alerts (
        alert_type,
        user_id,
        ip_address,
        user_agent,
        event_data,
        severity
      ) VALUES (
        'admin_new_location',
        p_user_id,
        p_ip_address,
        p_user_agent,
        jsonb_build_object(
          'first_time_ip', true,
          'user_role', 'admin'
        ),
        'medium'
      );
    END IF;
  END IF;
END;
$$;

-- 5. Add audit logging for data exports
CREATE OR REPLACE FUNCTION public.log_data_export(
  p_user_id uuid,
  p_export_type text,
  p_table_name text,
  p_record_count integer,
  p_filters jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics_events (
    event_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'data_export',
    p_user_id,
    jsonb_build_object(
      'export_type', p_export_type,
      'table_name', p_table_name,
      'record_count', p_record_count,
      'filters', p_filters,
      'timestamp', NOW()
    ),
    'info'
  );
  
  -- Alert on large data exports
  IF p_record_count > 1000 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      user_id,
      event_data,
      severity
    ) VALUES (
      'large_data_export',
      p_user_id,
      jsonb_build_object(
        'export_type', p_export_type,
        'table_name', p_table_name,
        'record_count', p_record_count
      ),
      'medium'
    );
  END IF;
END;
$$;

-- 6. Enhanced phone number masking for better privacy
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone_e164 text, requesting_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return full phone number only for admins and the phone's owner
  IF public.has_role(requesting_user_id, 'admin'::app_role) THEN
    RETURN phone_e164;
  ELSE
    -- Enhanced masking: show only country code and last 2 digits
    RETURN CASE 
      WHEN phone_e164 IS NULL THEN NULL
      WHEN LENGTH(phone_e164) > 6 THEN 
        LEFT(phone_e164, 2) || '***-***-' || RIGHT(phone_e164, 2)
      ELSE '***-**' || RIGHT(phone_e164, 1)
    END;
  END IF;
END;
$$;