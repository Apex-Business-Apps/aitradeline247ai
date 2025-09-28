-- PostgreSQL Upgrade Pre-Flight Security Hardening
-- Document and strengthen security before upgrade

-- 1. Create upgrade audit table
CREATE TABLE IF NOT EXISTS public.upgrade_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upgrade_phase text NOT NULL,
  check_name text NOT NULL,
  status text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on upgrade audit
ALTER TABLE public.upgrade_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for upgrade audit
CREATE POLICY "Admins can view upgrade audit" ON public.upgrade_audit
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage upgrade audit" ON public.upgrade_audit
FOR ALL USING (auth.role() = 'service_role'::text);

-- 2. Enhanced security function for post-upgrade validation
CREATE OR REPLACE FUNCTION public.validate_security_post_upgrade()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_results jsonb := '{}';
  v_rls_count integer;
  v_function_count integer;
  v_policy_count integer;
BEGIN
  -- Count RLS enabled tables
  SELECT COUNT(*) INTO v_rls_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' 
  AND n.nspname = 'public'
  AND c.relrowsecurity = true;
  
  -- Count security definer functions
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
  AND p.prosecdef = true;
  
  -- Count RLS policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public';
  
  v_results := jsonb_build_object(
    'rls_enabled_tables', v_rls_count,
    'security_definer_functions', v_function_count,
    'rls_policies', v_policy_count,
    'check_timestamp', now(),
    'status', 'completed'
  );
  
  -- Log the validation
  INSERT INTO public.upgrade_audit (
    upgrade_phase,
    check_name,
    status,
    details
  ) VALUES (
    'post_upgrade_validation',
    'security_configuration_check',
    'completed',
    v_results
  );
  
  RETURN v_results;
END;
$$;

-- 3. Pre-upgrade security baseline
INSERT INTO public.upgrade_audit (
  upgrade_phase,
  check_name,
  status,
  details
) VALUES (
  'pre_upgrade_baseline',
  'postgresql_version',
  'documented',
  jsonb_build_object(
    'version', version(),
    'timestamp', now()
  )
);

-- 4. Strengthen existing security functions with explicit search_path
CREATE OR REPLACE FUNCTION public.log_upgrade_step(
  p_phase text,
  p_step text,
  p_status text,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.upgrade_audit (
    upgrade_phase,
    check_name,
    status,
    details
  ) VALUES (
    p_phase,
    p_step,
    p_status,
    p_details
  );
END;
$$;

-- 5. Create upgrade monitoring function
CREATE OR REPLACE FUNCTION public.monitor_upgrade_health()
RETURNS TABLE(
  component text,
  status text,
  last_check timestamp with time zone,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Database Connection'::text,
    'healthy'::text,
    now(),
    'PostgreSQL connection active'::text
  UNION ALL
  SELECT 
    'RLS Policies'::text,
    CASE WHEN COUNT(*) > 0 THEN 'active' ELSE 'warning' END::text,
    now(),
    ('Total policies: ' || COUNT(*))::text
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  UNION ALL
  SELECT 
    'Security Functions'::text,
    CASE WHEN COUNT(*) > 0 THEN 'active' ELSE 'warning' END::text,
    now(),
    ('Security definer functions: ' || COUNT(*))::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
  AND p.prosecdef = true;
END;
$$;