-- Additional security hardening: Create secure masked appointment view
-- This provides a secure alternative for any code that might need appointment data

CREATE OR REPLACE FUNCTION public.get_secure_appointment(appointment_id uuid)
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
  email_masked text,
  e164_masked text,
  first_name_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Check access permissions first
  IF NOT public.is_org_member((SELECT organization_id FROM public.appointments WHERE id = appointment_id LIMIT 1)) THEN
    RAISE EXCEPTION 'Access denied: Not a member of the organization';
  END IF;

  -- Log access attempt
  PERFORM public.log_data_access('appointments', appointment_id::text, 'secure_appointment_view');
  
  -- Use service role privileges to access the data, but always return masked data
  SELECT * INTO appointment_record FROM public.appointments WHERE appointments.id = appointment_id;
  
  -- Return masked data regardless of user role
  RETURN QUERY
  SELECT 
    appointment_record.id,
    appointment_record.organization_id,
    appointment_record.start_at,
    appointment_record.end_at,
    appointment_record.status,
    appointment_record.source,
    appointment_record.tz,
    appointment_record.note,
    appointment_record.created_at,
    -- Always mask sensitive data for security
    CASE 
      WHEN appointment_record.email IS NOT NULL THEN 
        LEFT(appointment_record.email, 1) || '***@' || SPLIT_PART(appointment_record.email, '@', 2)
      ELSE NULL 
    END as email_masked,
    public.mask_phone_number(appointment_record.e164, auth.uid()) as e164_masked,
    CASE 
      WHEN appointment_record.first_name IS NOT NULL THEN 
        LEFT(appointment_record.first_name, 1) || '***'
      ELSE NULL 
    END as first_name_masked;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_org_appointments_secure(org_id uuid, limit_count integer DEFAULT 50)
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
  email_masked text,
  e164_masked text,
  first_name_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check permissions
  IF NOT public.is_org_member(org_id) THEN
    RAISE EXCEPTION 'Access denied: Not a member of the organization';
  END IF;
  
  -- Log bulk access for audit
  PERFORM public.log_data_access('appointments', org_id::text, 'bulk_secure_view');
  
  -- Return appointments with masked sensitive data
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
    -- Always mask sensitive data
    CASE 
      WHEN a.email IS NOT NULL THEN 
        LEFT(a.email, 1) || '***@' || SPLIT_PART(a.email, '@', 2)
      ELSE NULL 
    END as email_masked,
    public.mask_phone_number(a.e164, auth.uid()) as e164_masked,
    CASE 
      WHEN a.first_name IS NOT NULL THEN 
        LEFT(a.first_name, 1) || '***'
      ELSE NULL 
    END as first_name_masked
  FROM public.appointments a
  WHERE a.organization_id = org_id
  ORDER BY a.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_secure_appointment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_appointments_secure(uuid, integer) TO authenticated;