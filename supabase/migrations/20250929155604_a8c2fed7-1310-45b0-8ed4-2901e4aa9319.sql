-- Additional security hardening: Enhanced rate limiting and monitoring

-- Create comprehensive security monitoring trigger
CREATE OR REPLACE FUNCTION public.log_customer_pii_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log when accessing PII fields and not self-access
  IF TG_TABLE_NAME = 'profiles' AND 
     auth.uid() IS NOT NULL AND 
     auth.uid() != NEW.id THEN
    
    INSERT INTO public.data_access_audit (
      user_id,
      accessed_table,
      accessed_record_id,
      access_type,
      user_agent,
      ip_address
    ) VALUES (
      auth.uid(),
      'profiles_pii',
      NEW.id::text,
      'pii_access',
      NULL, -- Will be populated by application layer
      NULL  -- Will be populated by application layer
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Enhanced security monitoring functions
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

-- Enhanced authentication monitoring
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