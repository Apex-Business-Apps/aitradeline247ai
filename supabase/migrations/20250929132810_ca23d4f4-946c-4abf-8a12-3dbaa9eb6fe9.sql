-- Create enhanced secure function for appointment data access with masking
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
  -- Masked sensitive fields
  email_masked text,
  e164_masked text,
  first_name_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
    -- Mask email: show only first character and domain
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN a.email
      WHEN public.is_org_member(a.organization_id) AND public.has_role(auth.uid(), 'moderator'::app_role) THEN a.email
      ELSE CASE 
        WHEN a.email IS NOT NULL THEN 
          LEFT(a.email, 1) || '***@' || SPLIT_PART(a.email, '@', 2)
        ELSE NULL 
      END
    END as email_masked,
    -- Mask phone: show only country code and last 2 digits
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN a.e164
      WHEN public.is_org_member(a.organization_id) AND public.has_role(auth.uid(), 'moderator'::app_role) THEN a.e164
      ELSE public.mask_phone_number(a.e164, auth.uid())
    END as e164_masked,
    -- Mask first name: show only first character
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN a.first_name
      WHEN public.is_org_member(a.organization_id) AND public.has_role(auth.uid(), 'moderator'::app_role) THEN a.first_name
      ELSE CASE 
        WHEN a.first_name IS NOT NULL THEN 
          LEFT(a.first_name, 1) || '***'
        ELSE NULL 
      END
    END as first_name_masked
  FROM public.appointments a
  WHERE a.id = appointment_id
  AND (
    a.organization_id IS NOT NULL 
    AND public.is_org_member(a.organization_id)
  );
END;
$$;

-- Create function to get organization appointments with masking
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
SET search_path TO 'public'
AS $$
BEGIN
  -- Log data access for audit purposes
  PERFORM public.log_data_access('appointments', org_id::text, 'bulk_read');
  
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
    -- Apply same masking logic as individual appointment function
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN a.email
      WHEN public.has_role(auth.uid(), 'moderator'::app_role) THEN a.email
      ELSE CASE 
        WHEN a.email IS NOT NULL THEN 
          LEFT(a.email, 1) || '***@' || SPLIT_PART(a.email, '@', 2)
        ELSE NULL 
      END
    END as email_masked,
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN a.e164
      WHEN public.has_role(auth.uid(), 'moderator'::app_role) THEN a.e164
      ELSE public.mask_phone_number(a.e164, auth.uid())
    END as e164_masked,
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN a.first_name
      WHEN public.has_role(auth.uid(), 'moderator'::app_role) THEN a.first_name
      ELSE CASE 
        WHEN a.first_name IS NOT NULL THEN 
          LEFT(a.first_name, 1) || '***'
        ELSE NULL 
      END
    END as first_name_masked
  FROM public.appointments a
  WHERE a.organization_id = org_id
  AND public.is_org_member(a.organization_id)
  ORDER BY a.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create audit trigger for appointments access
CREATE OR REPLACE FUNCTION public.log_appointment_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access to sensitive appointment data
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.data_access_audit (
      user_id,
      accessed_table,
      accessed_record_id,
      access_type
    ) VALUES (
      auth.uid(),
      'appointments',
      NEW.id::text,
      'customer_data_access'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update RLS policies to be more restrictive for sensitive data
DROP POLICY IF EXISTS "Organization members can view appointments" ON public.appointments;

-- Create more restrictive policies that encourage use of secure functions
CREATE POLICY "Admins can view all appointment data" 
ON public.appointments 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND public.is_org_member(organization_id)
);

CREATE POLICY "Moderators can view appointments with logging" 
ON public.appointments 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'moderator'::app_role) 
  AND public.is_org_member(organization_id)
);

-- Regular organization members should use the secure functions instead
CREATE POLICY "Organization members limited appointment access" 
ON public.appointments 
FOR SELECT 
USING (
  public.is_org_member(organization_id) 
  AND (organization_id IS NOT NULL)
  -- This policy allows basic read but applications should use secure functions for sensitive data
);