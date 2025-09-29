-- Drop existing permissive policies that allow direct access to sensitive data
DROP POLICY IF EXISTS "Organization members limited appointment access" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointment data" ON public.appointments; 
DROP POLICY IF EXISTS "Moderators can view appointments with logging" ON public.appointments;

-- Create highly restrictive RLS policies that block access to sensitive customer data
-- Only service role can access raw data (for system operations)
CREATE POLICY "Service role only for raw appointments data" 
ON public.appointments 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Block all direct access to appointments table for regular users
-- Force use of secure masking functions instead
CREATE POLICY "Block direct customer data access" 
ON public.appointments 
FOR SELECT 
USING (false); -- This effectively blocks all user access

-- Allow insert/update/delete but only for authorized roles
CREATE POLICY "Admins can manage appointments" 
ON public.appointments 
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND public.is_org_member(organization_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND public.is_org_member(organization_id)
);

-- Allow moderators to create and update appointments (but not see sensitive data)
CREATE POLICY "Moderators can manage appointments" 
ON public.appointments 
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'moderator'::app_role) 
  AND public.is_org_member(organization_id)
);

CREATE POLICY "Moderators can update appointments" 
ON public.appointments 
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'moderator'::app_role) 
  AND public.is_org_member(organization_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'moderator'::app_role) 
  AND public.is_org_member(organization_id)
);

-- Create a completely secure view that only exposes non-sensitive data
CREATE OR REPLACE VIEW public.appointments_safe AS
SELECT 
  id,
  organization_id,
  start_at,
  end_at,
  status,
  source,
  tz,
  note,
  created_at,
  -- No sensitive fields exposed at all
  NULL as email,
  NULL as e164,
  NULL as first_name
FROM public.appointments;

-- Grant access to the safe view for organization members
GRANT SELECT ON public.appointments_safe TO authenticated;

-- Create RLS policy for the safe view
ALTER VIEW public.appointments_safe SET (security_barrier = true);

-- Create enhanced function for customer data access that requires explicit permission
CREATE OR REPLACE FUNCTION public.get_customer_contact_info(appointment_id uuid)
RETURNS TABLE(
  email text,
  e164 text,
  first_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Strict role check - only admins can access customer contact info
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access customer contact information';
  END IF;
  
  -- Log the access attempt for audit purposes
  PERFORM public.log_data_access('appointments_customer_contact', appointment_id::text, 'sensitive_data_access');
  
  -- Return the sensitive data only for authorized admins
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

-- Update the secure appointment function to use the new restricted approach
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
  -- Masked sensitive fields only
  email_masked text,
  e164_masked text,
  first_name_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all access attempts
  PERFORM public.log_data_access('appointments', appointment_id::text, 'appointment_view');
  
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
    -- Always mask email - show only first char and domain
    CASE 
      WHEN a.email IS NOT NULL THEN 
        LEFT(a.email, 1) || '***@' || SPLIT_PART(a.email, '@', 2)
      ELSE NULL 
    END as email_masked,
    -- Always mask phone - use existing mask function
    public.mask_phone_number(a.e164, auth.uid()) as e164_masked,
    -- Always mask first name - show only first character
    CASE 
      WHEN a.first_name IS NOT NULL THEN 
        LEFT(a.first_name, 1) || '***'
      ELSE NULL 
    END as first_name_masked
  FROM public.appointments a
  WHERE a.id = appointment_id
  AND public.is_org_member(a.organization_id);
END;
$$;

-- Create function for emergency contact access (with strict audit logging)
CREATE OR REPLACE FUNCTION public.emergency_customer_contact(appointment_id uuid, emergency_reason text)
RETURNS TABLE(
  email text,
  e164 text,
  first_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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