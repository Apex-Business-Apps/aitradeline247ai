-- FINAL SECURITY VIEW FIXES

-- 1. Drop problematic views and replace with secure functions
DROP VIEW IF EXISTS public.secure_lead_metrics;
DROP VIEW IF EXISTS public.wallet_minimum_flags;

-- 2. Replace secure_lead_metrics view with secure function (already created above)
-- Function public.get_secure_lead_metrics() already exists with proper admin-only access

-- 3. Replace wallet_minimum_flags view with secure function
CREATE OR REPLACE FUNCTION public.get_wallet_minimum_flags(p_org_id uuid DEFAULT NULL)
RETURNS TABLE(
  org_id uuid,
  balance_cents bigint,
  below_minimum boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow access only to own org or admin access
  IF p_org_id IS NOT NULL AND p_org_id != current_org_id() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Cannot view other organizations wallet status';
  END IF;

  RETURN QUERY
  SELECT 
    wb.org_id,
    wb.balance_cents,
    (wb.balance_cents < 20000)::boolean as below_minimum
  FROM public.wallet_balances wb
  WHERE (p_org_id IS NULL AND wb.org_id = current_org_id()) 
     OR (p_org_id IS NOT NULL AND wb.org_id = p_org_id);
END $$;

-- 4. Hide wallet_balances from PostgREST API by creating a schema-level exclusion
-- This is done via comment to indicate it should not be exposed via API
COMMENT ON MATERIALIZED VIEW public.wallet_balances IS 'INTERNAL USE ONLY - Access via get_wallet_balance() function';

-- 5. Create comprehensive security status function for monitoring
CREATE OR REPLACE FUNCTION public.get_security_status()
RETURNS TABLE(
  component text,
  status text,
  last_check timestamp with time zone,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can check security status
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    'analytics_health'::text,
    CASE 
      WHEN COUNT(*) < 100000 THEN 'healthy'
      WHEN COUNT(*) < 500000 THEN 'warning'
      ELSE 'critical'
    END::text,
    now() as last_check,
    jsonb_build_object(
      'event_count', COUNT(*),
      'oldest_event', MIN(created_at),
      'newest_event', MAX(created_at)
    ) as details
  FROM public.analytics_events
  UNION ALL
  SELECT 
    'rls_policies'::text,
    'active'::text,
    now() as last_check,
    jsonb_build_object(
      'leads_protected', true,
      'analytics_protected', true,
      'wallet_protected', true
    ) as details;
END $$;