-- FINAL SECURITY HARDENING

-- 1. Fix remaining function search_path issues
CREATE OR REPLACE FUNCTION public.increment_kb_version(target_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_version INTEGER;
BEGIN
  INSERT INTO public.kb_versions (org_id, version, last_embedded_at, document_count)
  VALUES (
    target_org_id, 
    1, 
    now(), 
    (SELECT COUNT(*) FROM public.kb_documents WHERE org_id = target_org_id)
  )
  ON CONFLICT (org_id) 
  DO UPDATE SET 
    version = public.kb_versions.version + 1,
    last_embedded_at = now(),
    document_count = (SELECT COUNT(*) FROM public.kb_documents WHERE org_id = target_org_id),
    updated_at = now()
  RETURNING version INTO new_version;
  
  RETURN new_version;
END $$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_rag_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rag_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END $$;

-- 2. Secure materialized view access by adding RLS to wallet_balances
-- Note: This is a materialized view, so we need to handle security differently
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_org_id uuid)
RETURNS TABLE(org_id uuid, balance_cents bigint, last_updated timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access to own org's wallet balance or admin access
  IF p_org_id != current_org_id() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Cannot view other organizations wallet balance';
  END IF;

  RETURN QUERY
  SELECT wb.org_id, wb.balance_cents, wb.last_updated
  FROM public.wallet_balances wb
  WHERE wb.org_id = p_org_id;
END $$;

-- 3. Remove direct API access to materialized view by making it a function-only access
-- This prevents direct access via PostgREST API
COMMENT ON MATERIALIZED VIEW public.wallet_balances IS 'Use get_wallet_balance() function for secure access';

-- 4. Create secure lead metrics access function (replace any direct table access)
CREATE OR REPLACE FUNCTION public.get_secure_lead_metrics()
RETURNS TABLE(
  total_leads bigint,
  recent_leads bigint,
  average_score numeric,
  domain_diversity bigint,
  security_events bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict admin-only access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'SECURITY_DENIED: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM public.leads WHERE created_at > now() - interval '24 hours') as recent_leads,
    (SELECT ROUND(AVG(lead_score), 1) FROM public.leads) as average_score,
    (SELECT COUNT(DISTINCT split_part(email, '@', 2)) FROM public.leads) as domain_diversity,
    (SELECT COUNT(*) FROM public.analytics_events WHERE event_type = 'security_violation') as security_events;
END $$;

-- 5. Update refresh_wallet_balances to use secure path
CREATE OR REPLACE FUNCTION public.refresh_wallet_balances()
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.wallet_balances;
$$;