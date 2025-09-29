-- Fix the security definer view issue by recreating without security definer
DROP VIEW IF EXISTS public.appointments_safe;

-- Create view without security definer properties
CREATE VIEW public.appointments_safe AS
SELECT 
  id,
  organization_id,
  start_at,
  end_at,
  status,
  source,
  tz,
  note,
  created_at
  -- Explicitly exclude: email, e164, first_name (sensitive data)
FROM public.appointments;

-- Grant SELECT access to authenticated users
GRANT SELECT ON public.appointments_safe TO authenticated;

-- Create a safer alternative function for viewing appointments without sensitive data
CREATE OR REPLACE FUNCTION public.get_appointments_summary(org_id uuid, limit_count integer DEFAULT 50)
RETURNS TABLE(
  id uuid,
  organization_id uuid,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  status text,
  source text,
  tz text,
  note text,
  created_at timestamp with time zone,
  has_contact_info boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check permissions
  IF NOT public.is_org_member(org_id) THEN
    RAISE EXCEPTION 'Access denied: Not a member of the organization';
  END IF;
  
  -- Log access for audit
  PERFORM public.log_data_access('appointments_summary', org_id::text, 'summary_view');
  
  -- Return non-sensitive appointment data with contact info flag
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
    -- Boolean flag to indicate if contact info exists (without exposing it)
    (a.email IS NOT NULL OR a.e164 IS NOT NULL OR a.first_name IS NOT NULL) as has_contact_info
  FROM public.appointments a
  WHERE a.organization_id = org_id
  ORDER BY a.created_at DESC
  LIMIT limit_count;
END;
$$;