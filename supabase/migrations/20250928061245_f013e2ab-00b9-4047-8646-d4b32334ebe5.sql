-- FIX SECURITY WARNINGS: Address all remaining security issues

-- 1. FIX FUNCTION SEARCH PATH MUTABLE - Add search_path to newly created functions
-- Update the functions that don't have SET search_path

-- Fix get_masked_profile function
CREATE OR REPLACE FUNCTION public.get_masked_profile(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone_e164_masked text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    public.mask_phone_number(p.phone_e164, auth.uid()) as phone_e164_masked,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_user_id
  AND (p.id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR share_org(auth.uid(), p.id));
$$;

-- Fix anonymize_ip_address function  
CREATE OR REPLACE FUNCTION public.anonymize_ip_address(ip inet)
RETURNS inet
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN family(ip) = 4 THEN 
      -- IPv4: mask last octet
      (host(ip)::text || '.0')::inet
    ELSE 
      -- IPv6: mask last 64 bits
      (regexp_replace(host(ip)::text, ':([^:]*:){0,3}[^:]*$', '::'))::inet
  END;
$$;

-- Fix log_analytics_event_secure function
CREATE OR REPLACE FUNCTION public.log_analytics_event_secure(
  p_event_type text,
  p_event_data jsonb DEFAULT '{}',
  p_user_session text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_anonymized_ip inet;
  v_scrubbed_data jsonb;
BEGIN
  -- Anonymize IP address
  v_anonymized_ip := CASE 
    WHEN p_ip_address IS NOT NULL THEN public.anonymize_ip_address(p_ip_address)
    ELSE NULL
  END;
  
  -- Scrub PII from event data
  v_scrubbed_data := p_event_data;
  
  -- Remove common PII fields
  v_scrubbed_data := v_scrubbed_data - 'email' - 'phone' - 'first_name' - 'last_name' - 'full_name';
  
  -- Use existing circuit breaker function with anonymized data
  RETURN public.safe_analytics_insert_with_circuit_breaker(
    p_event_type,
    v_scrubbed_data,
    p_user_session,
    p_page_url,
    v_anonymized_ip,
    p_user_agent
  );
END;
$$;

-- Fix log_data_access function
CREATE OR REPLACE FUNCTION public.log_data_access(
  p_table_name text,
  p_record_id text DEFAULT NULL,
  p_access_type text DEFAULT 'read'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type,
    created_at
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_record_id,
    p_access_type,
    now()
  );
END;
$$;

-- Fix detect_anomalous_access function
CREATE OR REPLACE FUNCTION public.detect_anomalous_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_suspicious_user_id uuid;
  v_access_count integer;
BEGIN
  -- Detect users with excessive data access in last hour
  FOR v_suspicious_user_id, v_access_count IN
    SELECT user_id, COUNT(*) as access_count
    FROM public.data_access_audit
    WHERE created_at > (now() - INTERVAL '1 hour')
    AND user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 100
  LOOP
    -- Log security alert
    INSERT INTO public.security_alerts (
      alert_type,
      user_id,
      event_data,
      severity
    ) VALUES (
      'excessive_data_access',
      v_suspicious_user_id,
      jsonb_build_object(
        'access_count', v_access_count,
        'time_window', '1 hour'
      ),
      'high'
    );
  END LOOP;
END;
$$;

-- 2. ADD DOCUMENTATION FOR CITEXT EXTENSION IN PUBLIC SCHEMA
-- Log the citext extension review in compliance table
INSERT INTO public.security_compliance (
  check_name,
  status,
  description,
  manual_action_required,
  remediation_notes
) VALUES (
  'extension_in_public_schema',
  'reviewed',
  'citext extension is in public schema - this is acceptable for case-insensitive text handling',
  false,
  'citext extension provides case-insensitive text type. Migration to separate schema not required as this extension is safe and widely used.'
) ON CONFLICT (check_name) DO UPDATE SET
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  manual_action_required = EXCLUDED.manual_action_required,
  remediation_notes = EXCLUDED.remediation_notes,
  last_checked = now();

-- 3. LOG POSTGRESQL UPGRADE REQUIREMENT
-- Add note about PostgreSQL security patches
INSERT INTO public.security_compliance (
  check_name,
  status,
  description,
  manual_action_required,
  remediation_notes
) VALUES (
  'postgresql_security_patches',
  'action_required',
  'PostgreSQL security patches are available and should be applied',
  true,
  'MANUAL ACTION REQUIRED: Upgrade PostgreSQL via Supabase Dashboard to apply security patches. Go to Dashboard → Settings → Database → Upgrade Database.'
) ON CONFLICT (check_name) DO UPDATE SET
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  manual_action_required = EXCLUDED.manual_action_required,
  remediation_notes = EXCLUDED.remediation_notes,
  last_checked = now();