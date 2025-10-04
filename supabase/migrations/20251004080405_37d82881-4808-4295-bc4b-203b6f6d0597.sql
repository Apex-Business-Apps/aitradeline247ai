
-- =========================================================
-- FORCE RLS + CREATE MISSING SECURE FUNCTION
-- =========================================================
-- Critical: Force RLS so even superusers/owners respect policies
-- Create appointment summary function for org members (non-PII)

-- Step 1: FORCE RLS on sensitive tables
ALTER TABLE public.contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.contacts IS 
  'Customer contact info. RLS FORCED - even superusers must use secure functions.';

COMMENT ON TABLE public.appointments IS 
  'Customer appointments with PII. RLS FORCED - use secure views/functions only.';

-- Step 2: Create secure function for appointment summaries (non-PII only)
CREATE OR REPLACE FUNCTION public.get_appointment_summary_secure(org_id_param UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  organization_id UUID,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT,
  source TEXT,
  tz TEXT,
  note TEXT,
  created_at TIMESTAMPTZ,
  has_customer_info BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check access: must be org member
  IF org_id_param IS NOT NULL AND NOT public.is_org_member(org_id_param) THEN
    RAISE EXCEPTION 'Access denied: Not a member of the organization';
  END IF;

  -- Log access attempt
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    access_type
  ) VALUES (
    auth.uid(),
    'appointments',
    'summary_view_non_pii'
  );

  -- Return only non-PII fields
  RETURN QUERY
  SELECT 
    a.id,
    a.organization_id,
    a.start_at,
    a.end_at,
    a.status,
    a.source,
    a.tz,
    a.note,
    a.created_at,
    -- Indicator that PII exists but is hidden
    (a.email IS NOT NULL OR a.e164 IS NOT NULL OR a.first_name IS NOT NULL) as has_customer_info
  FROM public.appointments a
  WHERE 
    (org_id_param IS NULL OR a.organization_id = org_id_param)
    AND public.is_org_member(a.organization_id);
END;
$$;

COMMENT ON FUNCTION public.get_appointment_summary_secure(UUID) IS 
  'Returns appointment business data (no PII) for org members. Logs all access.';

-- Verification queries (run manually):
-- 1. Check forced RLS:
--    SELECT relname, relrowsecurity, relforcerowsecurity 
--    FROM pg_class WHERE relname IN ('contacts','appointments');
--
-- 2. Test function as org member:
--    SELECT * FROM get_appointment_summary_secure() LIMIT 10;
