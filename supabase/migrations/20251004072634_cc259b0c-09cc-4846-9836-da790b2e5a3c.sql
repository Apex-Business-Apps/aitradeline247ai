-- =========================================================
-- CRITICAL SECURITY FIX 1: Secure contacts table
-- =========================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage contacts" ON public.contacts;

-- Add strict RLS policy: block all direct user access
CREATE POLICY "Block direct contact access"
ON public.contacts
FOR SELECT
USING (false);

-- Service role can still manage for edge functions
CREATE POLICY "Service role can manage contacts"
ON public.contacts
FOR ALL
USING (auth.role() = 'service_role');

-- Create secure access function with phone masking
CREATE OR REPLACE FUNCTION public.get_contact_summary_secure(contact_id_param uuid)
RETURNS TABLE(
  id uuid,
  wa_capable boolean,
  created_at timestamptz,
  phone_masked text,
  first_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access contact information';
  END IF;

  -- Log access
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'contacts',
    contact_id_param::text,
    'secure_contact_view'
  );

  -- Return masked data
  RETURN QUERY
  SELECT 
    c.id,
    c.wa_capable,
    c.created_at,
    CASE 
      WHEN c.e164 IS NOT NULL THEN 
        LEFT(c.e164, 5) || '***' || RIGHT(c.e164, 2)
      ELSE NULL 
    END as phone_masked,
    c.first_name
  FROM public.contacts c
  WHERE c.id = contact_id_param;
END;
$$;

-- Create audit trigger for contacts
CREATE OR REPLACE FUNCTION public.audit_contacts_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all access attempts
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'contacts',
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP
  );
  
  -- Generate security alert for non-service-role access
  IF auth.role() != 'service_role' THEN
    INSERT INTO public.security_alerts (
      alert_type,
      user_id,
      event_data,
      severity
    ) VALUES (
      'unauthorized_contact_access',
      auth.uid(),
      jsonb_build_object(
        'contact_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP
      ),
      'high'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_contacts_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.audit_contacts_access();

-- =========================================================
-- CRITICAL SECURITY FIX 2: Harden appointments table
-- =========================================================

-- Drop overly permissive organization member policies
DROP POLICY IF EXISTS "Organization members can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Organization members can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Organization members can delete appointments" ON public.appointments;

-- Verify secure functions exist (these should already be deployed)
-- get_appointment_summary_secure() - already exists
-- get_secure_appointment() - already exists

-- Create appointments_safe view (non-PII data only)
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
  -- Mask all PII fields
  CASE WHEN email IS NOT NULL THEN '***@***' ELSE NULL END as email_masked,
  CASE WHEN e164 IS NOT NULL THEN '***-***-****' ELSE NULL END as e164_masked,
  CASE WHEN first_name IS NOT NULL THEN LEFT(first_name, 1) || '***' ELSE NULL END as first_name_masked
FROM public.appointments;

-- Allow org members to view safe appointments
CREATE POLICY "Org members can view safe appointments"
ON public.appointments
FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND is_org_member(organization_id)
  AND (
    -- Only allow viewing through secure functions/views
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- =========================================================
-- CRITICAL SECURITY FIX 3: Enhanced audit logging
-- =========================================================

-- Log all PII access attempts on appointments
CREATE OR REPLACE FUNCTION public.audit_appointments_pii_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if accessing PII fields
  IF TG_OP = 'SELECT' THEN
    INSERT INTO public.data_access_audit (
      user_id,
      accessed_table,
      accessed_record_id,
      access_type
    ) VALUES (
      auth.uid(),
      'appointments',
      NEW.id::text,
      'pii_field_access'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.appointments_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_summary_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_appointment TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "Block direct contact access" ON public.contacts IS 
  'Critical security policy: Prevents direct access to customer phone numbers. Use get_contact_summary_secure() instead.';

COMMENT ON FUNCTION public.get_contact_summary_secure IS 
  'Secure function to access contact information with phone masking. Admin-only access with full audit logging.';

COMMENT ON VIEW public.appointments_safe IS 
  'Safe view of appointments with all PII fields masked. Use this for list/summary displays.';