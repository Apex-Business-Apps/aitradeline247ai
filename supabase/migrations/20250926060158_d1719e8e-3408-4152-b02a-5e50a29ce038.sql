-- Fix leads table security vulnerability by implementing stricter RLS policies
-- Drop existing complex policies that may have gaps
DROP POLICY IF EXISTS "leads_admin_secure_access" ON public.leads;
DROP POLICY IF EXISTS "leads_block_anonymous_all" ON public.leads;
DROP POLICY IF EXISTS "leads_service_block_delete" ON public.leads;
DROP POLICY IF EXISTS "leads_service_block_select" ON public.leads;
DROP POLICY IF EXISTS "leads_service_block_update" ON public.leads;
DROP POLICY IF EXISTS "leads_service_secure_insert" ON public.leads;

-- Create new strict deny-by-default policies
-- Deny all access by default
CREATE POLICY "leads_deny_all_default" ON public.leads
  FOR ALL USING (false) WITH CHECK (false);

-- Allow only authenticated admin users to read leads
CREATE POLICY "leads_admin_read_only" ON public.leads
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND auth.jwt() IS NOT NULL 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Allow only service role to insert leads (for lead capture forms)
CREATE POLICY "leads_service_insert_only" ON public.leads
  FOR INSERT 
  TO service_role
  WITH CHECK (
    auth.role() = 'service_role'
    AND name IS NOT NULL 
    AND email IS NOT NULL 
    AND company IS NOT NULL
    AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(trim(name)) >= 2 
    AND length(trim(company)) >= 2
    AND length(name) <= 100 
    AND length(company) <= 100 
    AND length(email) <= 255
    AND source = ANY(ARRAY['website', 'landing_page', 'contact_form', 'secure_website_form', 'verified_api'])
    AND name !~ '[<>"\''{}();]'
    AND company !~ '[<>"\''{}();]'
  );

-- Allow only authenticated admin users to update leads (status changes, assignments)
CREATE POLICY "leads_admin_update_only" ON public.leads
  FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND auth.jwt() IS NOT NULL 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.jwt() IS NOT NULL 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Completely block DELETE operations for data retention
CREATE POLICY "leads_block_delete" ON public.leads
  FOR DELETE USING (false);

-- Add security audit logging for all lead access
CREATE OR REPLACE FUNCTION public.audit_lead_access_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all access attempts to leads table
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url
  ) VALUES (
    'lead_security_audit',
    jsonb_build_object(
      'operation', TG_OP,
      'user_id', auth.uid(),
      'user_role', auth.role(),
      'timestamp', now(),
      'lead_id', COALESCE(NEW.id, OLD.id),
      'security_level', 'critical',
      'email_domain', CASE 
        WHEN TG_OP = 'DELETE' THEN split_part(OLD.email, '@', 2)
        ELSE split_part(NEW.email, '@', 2)
      END
    ),
    COALESCE(auth.uid()::text, 'system'),
    'leads_security_monitoring'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply security audit trigger to leads table
DROP TRIGGER IF EXISTS audit_lead_access_secure_trigger ON public.leads;
CREATE TRIGGER audit_lead_access_secure_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_access_secure();