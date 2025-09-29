-- CRITICAL SECURITY FIX: Replace unsafe appointments_safe view with secure functions
-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_appointments_summary(uuid, integer);
DROP FUNCTION IF EXISTS public.get_customer_contact_info(uuid);
DROP FUNCTION IF EXISTS public.emergency_customer_contact(uuid, text);

-- Drop the unsafe view that exposes customer PII
DROP VIEW IF EXISTS public.appointments_safe;

-- Create secure function to get appointment summaries (NO PII exposed)
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
SET search_path = public
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

-- Create admin-only function for customer contact access (heavily audited)
CREATE OR REPLACE FUNCTION public.get_customer_contact_info(appointment_id uuid)
RETURNS TABLE(
  email text,
  e164 text,
  first_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict admin-only access
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access customer contact information';
  END IF;
  
  -- Heavy audit logging for customer data access
  PERFORM public.log_data_access('appointments_customer_contact', appointment_id::text, 'admin_customer_access');
  
  INSERT INTO public.security_alerts (
    alert_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'customer_contact_access',
    auth.uid(),
    jsonb_build_object(
      'appointment_id', appointment_id,
      'access_timestamp', NOW(),
      'function_used', 'get_customer_contact_info'
    ),
    'medium'
  );
  
  -- Return unmasked data only for verified admin access
  RETURN QUERY
  SELECT 
    a.email,
    a.e164,
    a.first_name
  FROM public.appointments a
  WHERE a.id = appointment_id
  AND public.is_org_member(a.organization_id);
END;
$$;

-- Create emergency contact function with maximum security
CREATE OR REPLACE FUNCTION public.emergency_customer_contact(appointment_id uuid, emergency_reason text)
RETURNS TABLE(
  email text,
  e164 text,
  first_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access emergency contact info
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Emergency contact access requires administrator privileges';
  END IF;
  
  -- Log the emergency access with reason
  INSERT INTO public.security_alerts (
    alert_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'emergency_customer_contact_access',
    auth.uid(),
    jsonb_build_object(
      'appointment_id', appointment_id,
      'emergency_reason', emergency_reason,
      'timestamp', NOW()
    ),
    'high'
  );
  
  -- Return the contact information
  RETURN QUERY
  SELECT 
    a.email,
    a.e164,
    a.first_name
  FROM public.appointments a
  WHERE a.id = appointment_id
  AND public.is_org_member(a.organization_id);
END;
$$;

-- Grant execute permissions on the secure functions
GRANT EXECUTE ON FUNCTION public.get_appointments_summary(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_contact_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.emergency_customer_contact(uuid, text) TO authenticated;

-- Revoke any unsafe permissions from the appointments table
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.appointments FROM authenticated;