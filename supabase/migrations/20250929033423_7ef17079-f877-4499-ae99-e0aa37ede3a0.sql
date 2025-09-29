-- Enhanced Security Monitoring: Anomaly Detection and Alerting
-- Create functions for advanced pattern detection and automated alerting

-- Enhanced anomaly detection with alerting
CREATE OR REPLACE FUNCTION public.detect_and_alert_anomalies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Customer Data Segmentation: Enhanced role-based restrictions
-- Add more granular data access control for customer PII

-- Function to check if user can access customer PII
CREATE OR REPLACE FUNCTION public.can_access_customer_pii(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    public.has_role(_user_id, 'admin'::app_role) OR
    public.has_role(_user_id, 'moderator'::app_role)
$function$;

-- Enhanced profile access with PII segmentation
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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Log customer PII access for audit trail
CREATE OR REPLACE FUNCTION public.log_customer_pii_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Enhanced security event logging with context
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  p_event_type text,
  p_user_id uuid DEFAULT auth.uid(),
  p_session_id text DEFAULT NULL,
  p_event_data jsonb DEFAULT '{}',
  p_severity text DEFAULT 'info',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.analytics_events (
    event_type,
    user_id,
    session_id,
    event_data,
    severity,
    ip_address,
    user_agent
  ) VALUES (
    p_event_type,
    p_user_id,
    p_session_id,
    p_event_data || jsonb_build_object(
      'timestamp', NOW(),
      'source', 'security_monitoring'
    ),
    p_severity,
    p_ip_address,
    p_user_agent
  );
  
  -- Auto-trigger anomaly detection for high-severity events
  IF p_severity IN ('error', 'critical') THEN
    PERFORM public.detect_and_alert_anomalies();
  END IF;
END;
$function$;