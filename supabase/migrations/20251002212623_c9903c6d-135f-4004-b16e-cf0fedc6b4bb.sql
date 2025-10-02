-- Security Monitoring Dashboard Functions
-- These functions aggregate security metrics for the monitoring dashboard

-- Function to get failed authentication attempts summary
CREATE OR REPLACE FUNCTION public.get_failed_auth_summary(time_window INTERVAL DEFAULT '24 hours')
RETURNS TABLE(
  total_failures BIGINT,
  unique_ips BIGINT,
  unique_users BIGINT,
  top_ip TEXT,
  recent_failures JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH failures AS (
    SELECT 
      ip_address::TEXT as ip,
      user_id,
      created_at,
      event_data
    FROM analytics_events
    WHERE event_type = 'auth_failed'
    AND created_at > (NOW() - time_window)
  ),
  ip_counts AS (
    SELECT ip, COUNT(*) as count
    FROM failures
    GROUP BY ip
    ORDER BY count DESC
    LIMIT 1
  )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM failures) as total_failures,
    (SELECT COUNT(DISTINCT ip)::BIGINT FROM failures) as unique_ips,
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM failures WHERE user_id IS NOT NULL) as unique_users,
    (SELECT ip FROM ip_counts) as top_ip,
    (SELECT jsonb_agg(jsonb_build_object(
      'ip', ip,
      'timestamp', created_at,
      'user_id', user_id
    ) ORDER BY created_at DESC)
    FROM failures
    LIMIT 10) as recent_failures;
END;
$$;

-- Function to get rate limiting statistics
CREATE OR REPLACE FUNCTION public.get_rate_limit_stats(time_window INTERVAL DEFAULT '24 hours')
RETURNS TABLE(
  hotline_ani_blocks BIGINT,
  hotline_ip_blocks BIGINT,
  support_ticket_limits BIGINT,
  active_blocks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM hotline_rate_limit_ani 
     WHERE created_at > (NOW() - time_window) AND block_until IS NOT NULL) as hotline_ani_blocks,
    (SELECT COUNT(*)::BIGINT FROM hotline_rate_limit_ip 
     WHERE created_at > (NOW() - time_window) AND block_until IS NOT NULL) as hotline_ip_blocks,
    (SELECT COUNT(*)::BIGINT FROM support_ticket_rate_limits 
     WHERE created_at > (NOW() - time_window)) as support_ticket_limits,
    (SELECT COUNT(*)::BIGINT FROM security_alerts 
     WHERE created_at > (NOW() - time_window) AND NOT resolved) as active_blocks;
END;
$$;

-- Function to get PII access audit summary
CREATE OR REPLACE FUNCTION public.get_pii_access_summary(time_window INTERVAL DEFAULT '24 hours')
RETURNS TABLE(
  total_accesses BIGINT,
  unique_users BIGINT,
  by_access_type JSONB,
  by_table JSONB,
  recent_accesses JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH accesses AS (
    SELECT 
      user_id,
      accessed_table,
      access_type,
      created_at,
      accessed_record_id
    FROM data_access_audit
    WHERE created_at > (NOW() - time_window)
    AND accessed_table IN ('profiles_pii', 'appointments', 'appointments_customer_contact')
  )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM accesses) as total_accesses,
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM accesses WHERE user_id IS NOT NULL) as unique_users,
    (SELECT jsonb_object_agg(access_type, count)
     FROM (
       SELECT access_type, COUNT(*) as count
       FROM accesses
       GROUP BY access_type
     ) t) as by_access_type,
    (SELECT jsonb_object_agg(accessed_table, count)
     FROM (
       SELECT accessed_table, COUNT(*) as count
       FROM accesses
       GROUP BY accessed_table
     ) t) as by_table,
    (SELECT jsonb_agg(jsonb_build_object(
      'user_id', user_id,
      'table', accessed_table,
      'access_type', access_type,
      'timestamp', created_at,
      'record_id', accessed_record_id
    ) ORDER BY created_at DESC)
    FROM accesses
    LIMIT 20) as recent_accesses;
END;
$$;

-- Function to get security alerts summary
CREATE OR REPLACE FUNCTION public.get_security_alerts_summary(time_window INTERVAL DEFAULT '24 hours')
RETURNS TABLE(
  total_alerts BIGINT,
  critical_alerts BIGINT,
  high_alerts BIGINT,
  unresolved_alerts BIGINT,
  by_type JSONB,
  recent_alerts JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH alerts AS (
    SELECT 
      alert_type,
      severity,
      resolved,
      created_at,
      user_id,
      event_data
    FROM security_alerts
    WHERE created_at > (NOW() - time_window)
  )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM alerts) as total_alerts,
    (SELECT COUNT(*)::BIGINT FROM alerts WHERE severity = 'critical') as critical_alerts,
    (SELECT COUNT(*)::BIGINT FROM alerts WHERE severity = 'high') as high_alerts,
    (SELECT COUNT(*)::BIGINT FROM alerts WHERE NOT resolved) as unresolved_alerts,
    (SELECT jsonb_object_agg(alert_type, count)
     FROM (
       SELECT alert_type, COUNT(*) as count
       FROM alerts
       GROUP BY alert_type
     ) t) as by_type,
    (SELECT jsonb_agg(jsonb_build_object(
      'type', alert_type,
      'severity', severity,
      'resolved', resolved,
      'timestamp', created_at,
      'user_id', user_id,
      'data', event_data
    ) ORDER BY created_at DESC)
    FROM alerts
    LIMIT 20) as recent_alerts;
END;
$$;

-- Function to get comprehensive security dashboard data
CREATE OR REPLACE FUNCTION public.get_security_dashboard_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Only admins can access security dashboard
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access security dashboard';
  END IF;

  SELECT jsonb_build_object(
    'failed_auth', (SELECT row_to_json(r) FROM public.get_failed_auth_summary() r),
    'rate_limits', (SELECT row_to_json(r) FROM public.get_rate_limit_stats() r),
    'pii_access', (SELECT row_to_json(r) FROM public.get_pii_access_summary() r),
    'security_alerts', (SELECT row_to_json(r) FROM public.get_security_alerts_summary() r),
    'generated_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;