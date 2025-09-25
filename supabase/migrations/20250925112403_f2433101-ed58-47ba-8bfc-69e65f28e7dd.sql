-- CRITICAL SECURITY FIXES (CORRECTED)

-- 1. Fix Stack Depth Crisis - Remove problematic triggers and implement safe analytics
DROP TRIGGER IF EXISTS log_analytics_audit ON public.analytics_events;
DROP TRIGGER IF EXISTS auto_anonymize_analytics_trigger ON public.analytics_events;

-- Create safe analytics insert function with circuit breaker
CREATE OR REPLACE FUNCTION public.safe_analytics_insert(
  p_event_type text,
  p_event_data jsonb DEFAULT NULL,
  p_user_session text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Circuit breaker: prevent recursion
  IF p_event_type IN ('analytics_audit', 'analytics_access_audit', 'security_audit') THEN
    RETURN; -- Skip audit events to prevent recursion
  END IF;
  
  -- Insert with size limits
  INSERT INTO public.analytics_events (
    event_type, event_data, user_session, page_url, ip_address, user_agent
  ) VALUES (
    p_event_type,
    COALESCE(p_event_data, '{}'::jsonb),
    LEFT(COALESCE(p_user_session, ''), 100),
    LEFT(COALESCE(p_page_url, ''), 500),
    LEFT(COALESCE(p_ip_address, ''), 45),
    LEFT(COALESCE(p_user_agent, ''), 500)
  );
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Analytics insert failed: %', SQLERRM;
END $$;

-- 2. Convert analytics_privacy_summary view to secure function (views can't have RLS)
DROP VIEW IF EXISTS public.analytics_privacy_summary;

CREATE OR REPLACE FUNCTION public.get_analytics_privacy_summary()
RETURNS TABLE(
  time_window timestamp with time zone,
  event_type text,
  event_count bigint,
  unique_sessions bigint,
  traffic_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access analytics summary
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    date_trunc('hour', ae.created_at) as time_window,
    ae.event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT ae.user_session) as unique_sessions,
    CASE 
      WHEN COUNT(*) > 1000 THEN 'high'
      WHEN COUNT(*) > 100 THEN 'medium' 
      ELSE 'low'
    END as traffic_level
  FROM public.analytics_events ae
  WHERE ae.created_at > now() - interval '24 hours'
  GROUP BY date_trunc('hour', ae.created_at), ae.event_type
  ORDER BY time_window DESC;
END $$;

-- 3. Add performance indexes to analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_session ON public.analytics_events(user_session);

-- 4. Clean up excessive analytics data (keep last 30 days only for performance)
DELETE FROM public.analytics_events 
WHERE created_at < now() - interval '30 days';

-- 5. Create secure wallet balance refresh function
CREATE OR REPLACE FUNCTION public.safe_refresh_wallet_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.wallet_balances;
EXCEPTION 
  WHEN OTHERS THEN
    -- Fallback to non-concurrent refresh
    REFRESH MATERIALIZED VIEW public.wallet_balances;
END $$;

-- 6. Update all existing functions to use proper search_path (security hardening)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete analytics events older than 90 days
  DELETE FROM public.analytics_events 
  WHERE created_at < now() - interval '90 days';
  
  -- Anonymize IP addresses older than 30 days
  UPDATE public.analytics_events 
  SET ip_address = 'anonymized'
  WHERE created_at < now() - interval '30 days' 
    AND ip_address IS NOT NULL 
    AND ip_address != 'anonymized';
END $$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() - interval '7 days';
END $$;

-- 7. Update post_wallet_entry to use safe refresh
CREATE OR REPLACE FUNCTION public.post_wallet_entry(
  p_org_id uuid,
  p_type ledger_entry_type,
  p_amount_cents bigint,
  p_related_type text,
  p_related_id uuid,
  p_idempotency_key text,
  p_memo text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  -- if idem key exists, return existing
  SELECT id INTO v_id FROM public.wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.wallet_ledger(org_id,entry_type,amount_cents,related_type,related_id,idempotency_key,memo)
  VALUES (p_org_id,p_type,p_amount_cents,p_related_type,p_related_id,p_idempotency_key,p_memo)
  RETURNING id INTO v_id;

  PERFORM public.safe_refresh_wallet_balances();
  RETURN v_id;
END $$;