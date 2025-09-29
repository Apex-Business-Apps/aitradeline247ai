-- Enhanced security monitoring and alerting system
-- Create enhanced security monitoring functions

CREATE OR REPLACE FUNCTION public.detect_and_alert_anomalies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_support_spam_count integer;
  v_failed_auth_ips text[];
  v_large_export_users uuid[];
  v_suspicious_profile_access uuid[];
BEGIN
  -- Detect support ticket spam patterns (>10 tickets in 1 hour)
  SELECT COUNT(DISTINCT email) INTO v_support_spam_count
  FROM public.analytics_events
  WHERE event_type IN ('support_ticket_rate_limit_ip', 'support_ticket_rate_limit_email')
  AND created_at > (NOW() - INTERVAL '1 hour');
  
  IF v_support_spam_count >= 5 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      event_data,
      severity
    ) VALUES (
      'support_ticket_spam_wave',
      jsonb_build_object(
        'unique_sources', v_support_spam_count,
        'detection_window', '1 hour'
      ),
      'high'
    );
  END IF;
  
  -- Detect distributed brute force (multiple IPs with auth failures)
  SELECT array_agg(DISTINCT (event_data->>'ip')::text) INTO v_failed_auth_ips
  FROM public.analytics_events
  WHERE event_type = 'auth_failed'
  AND created_at > (NOW() - INTERVAL '30 minutes')
  GROUP BY (event_data->>'ip')::text
  HAVING COUNT(*) >= 3;
  
  IF array_length(v_failed_auth_ips, 1) >= 3 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      event_data,
      severity
    ) VALUES (
      'distributed_brute_force',
      jsonb_build_object(
        'source_ips', v_failed_auth_ips,
        'detection_window', '30 minutes'
      ),
      'critical'
    );
  END IF;
  
  -- Detect unusual data export patterns
  SELECT array_agg(user_id) INTO v_large_export_users
  FROM public.data_access_audit
  WHERE access_type = 'export'
  AND created_at > (NOW() - INTERVAL '2 hours')
  GROUP BY user_id
  HAVING COUNT(*) >= 10;
  
  IF array_length(v_large_export_users, 1) >= 1 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      user_id,
      event_data,
      severity
    ) VALUES (
      'excessive_data_export',
      v_large_export_users[1],
      jsonb_build_object(
        'affected_users', v_large_export_users,
        'detection_window', '2 hours'
      ),
      'high'
    );
  END IF;
  
  -- Detect unusual profile access patterns (non-admin accessing many profiles)
  SELECT array_agg(DISTINCT user_id) INTO v_suspicious_profile_access
  FROM public.data_access_audit
  WHERE accessed_table = 'profiles'
  AND user_id IS NOT NULL
  AND NOT public.has_role(user_id, 'admin'::app_role)
  AND created_at > (NOW() - INTERVAL '1 hour')
  GROUP BY user_id
  HAVING COUNT(DISTINCT accessed_record_id) >= 20;
  
  IF array_length(v_suspicious_profile_access, 1) >= 1 THEN
    INSERT INTO public.security_alerts (
      alert_type,
      user_id,
      event_data,
      severity
    ) VALUES (
      'suspicious_profile_enumeration',
      v_suspicious_profile_access[1],
      jsonb_build_object(
        'suspicious_users', v_suspicious_profile_access,
        'detection_window', '1 hour'
      ),
      'high'
    );
  END IF;
END;
$$;

-- Enhanced authentication logging with security alerts
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  p_event_type text,
  p_success boolean,
  p_user_identifier text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_attempts integer;
BEGIN
  -- Check for excessive failed attempts from same IP
  IF NOT p_success THEN
    SELECT COUNT(*) INTO v_recent_attempts
    FROM public.analytics_events
    WHERE event_type = 'auth_failed'
    AND ip_address = p_ip_address
    AND created_at > (NOW() - INTERVAL '15 minutes');
    
    -- Alert on suspicious activity
    IF v_recent_attempts > 3 THEN
      INSERT INTO public.security_alerts (
        alert_type,
        ip_address,
        user_agent,
        event_data,
        severity
      ) VALUES (
        'suspicious_auth_attempts',
        p_ip_address,
        p_user_agent,
        jsonb_build_object(
          'attempt_count', v_recent_attempts,
          'user_identifier', p_user_identifier
        ),
        'high'
      );
    END IF;
  END IF;
  
  -- Log the authentication attempt (anonymized)
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    p_event_type,
    jsonb_build_object(
      'success', p_success,
      'timestamp', NOW()
    ),
    public.anonymize_ip_address(p_ip_address),
    p_user_agent,
    CASE WHEN p_success THEN 'info' ELSE 'warning' END
  );
END;
$$;

-- Create security compliance checking function
CREATE OR REPLACE FUNCTION public.can_access_customer_pii(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'admin'::app_role) OR
    public.has_role(_user_id, 'moderator'::app_role)
$$;

-- Enhanced profile access with restrictions
CREATE OR REPLACE FUNCTION public.get_profile_with_restrictions(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  phone_e164_masked text,
  phone_e164_full text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    CASE 
      WHEN public.can_access_customer_pii(auth.uid()) THEN p.full_name
      WHEN p.id = auth.uid() THEN p.full_name
      ELSE LEFT(p.full_name, 1) || '***'
    END as full_name,
    public.mask_phone_number(p.phone_e164, auth.uid()) as phone_e164_masked,
    CASE 
      WHEN public.can_access_customer_pii(auth.uid()) THEN p.phone_e164
      WHEN p.id = auth.uid() THEN p.phone_e164
      ELSE NULL
    END as phone_e164_full,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_user_id
  AND (
    p.id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.share_org(auth.uid(), p.id)
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.detect_and_alert_anomalies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_attempt(text, boolean, text, inet, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_customer_pii(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_with_restrictions(uuid) TO authenticated;