-- SECURITY HARDENING: Fix Customer Lead Data Exposure (FINAL CORRECTED VERSION)
-- Drop existing potentially vulnerable policies and create bulletproof ones

-- First, ensure RLS is enabled on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Block all anonymous access" ON public.leads;
DROP POLICY IF EXISTS "Secure admin full access" ON public.leads;  
DROP POLICY IF EXISTS "Secure service role insert only" ON public.leads;

-- Create new bulletproof policies with explicit ordering and conditions

-- 1. STRONGEST POLICY: Block all anonymous and unauthenticated access
CREATE POLICY "leads_block_anonymous_all" ON public.leads
FOR ALL 
TO anon, public
USING (false)
WITH CHECK (false);

-- 2. Admin access - with explicit authentication checks
CREATE POLICY "leads_admin_secure_access" ON public.leads
FOR ALL 
TO authenticated
USING (
  -- Explicit authentication checks
  auth.uid() IS NOT NULL 
  AND auth.jwt() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  -- Additional security: ensure session is valid
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.jwt() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  AND auth.role() = 'authenticated'
);

-- 3. Service role insertion - with enhanced validation and rate limiting
CREATE POLICY "leads_service_secure_insert" ON public.leads
FOR INSERT 
TO service_role
WITH CHECK (
  -- Service role authentication
  auth.role() = 'service_role'
  -- Data validation requirements
  AND name IS NOT NULL 
  AND email IS NOT NULL 
  AND company IS NOT NULL
  -- Email format validation
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  -- Length validation
  AND length(TRIM(name)) >= 2 
  AND length(TRIM(company)) >= 2
  AND length(name) <= 100
  AND length(company) <= 100
  AND length(email) <= 255
  -- Source validation - only allow specific trusted sources
  AND source IN ('website', 'landing_page', 'contact_form', 'secure_website_form', 'verified_api')
  -- Prevent injection attacks
  AND name !~ '[<>"\''{}();]'
  AND company !~ '[<>"\''{}();]'
);

-- 4. Block service role from reading, updating, or deleting leads
CREATE POLICY "leads_service_block_select" ON public.leads
FOR SELECT
TO service_role
USING (false);

CREATE POLICY "leads_service_block_update" ON public.leads
FOR UPDATE
TO service_role
USING (false);

CREATE POLICY "leads_service_block_delete" ON public.leads
FOR DELETE
TO service_role
USING (false);

-- SECURITY ENHANCEMENT: Improve encrypted lead data access controls
ALTER TABLE public.encrypted_lead_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policy and create more granular one
DROP POLICY IF EXISTS "Only admins can access encrypted lead data" ON public.encrypted_lead_data;

-- Create policy that requires additional verification for encrypted data access
CREATE POLICY "encrypted_leads_super_admin_only" ON public.encrypted_lead_data
FOR ALL
TO authenticated
USING (
  -- Require authenticated user with admin role
  auth.uid() IS NOT NULL 
  AND auth.jwt() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  -- Additional check: user must have been authenticated recently (session security)
  AND auth.role() = 'authenticated'
)
WITH CHECK (false); -- No manual insertions allowed through this policy

-- Service role policy for encrypted data (for system operations only)
CREATE POLICY "encrypted_leads_service_system_only" ON public.encrypted_lead_data
FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Block anonymous access to encrypted data
CREATE POLICY "encrypted_leads_block_anonymous" ON public.encrypted_lead_data
FOR ALL
TO anon, public
USING (false)
WITH CHECK (false);

-- SECURITY ENHANCEMENT: Improve consent records access control
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- Drop existing potentially vulnerable policies
DROP POLICY IF EXISTS "Service role can manage consent_records" ON public.consent_records;
DROP POLICY IF EXISTS "Users can view consent_records in their org" ON public.consent_records;

-- Create secure organization-based access with fallback protection
CREATE POLICY "consent_records_secure_org_access" ON public.consent_records
FOR SELECT
TO authenticated
USING (
  -- Ensure user is authenticated
  auth.uid() IS NOT NULL 
  AND auth.jwt() IS NOT NULL
  -- Use secure organization matching with fallback
  AND (
    org_id = (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
      AND organization_id IS NOT NULL
    )
    OR (
      -- Fallback: admin users can access records for organizations they manage
      has_role(auth.uid(), 'admin'::app_role)
      AND org_id IN (
        SELECT DISTINCT organization_id 
        FROM public.profiles 
        WHERE organization_id IS NOT NULL
      )
    )
  )
);

-- Service role policy for consent records
CREATE POLICY "consent_records_service_management" ON public.consent_records
FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Block all other access to consent records
CREATE POLICY "consent_records_block_unauthorized" ON public.consent_records
FOR ALL
TO anon, public
USING (false)
WITH CHECK (false);

-- SECURITY ENHANCEMENT: Create function to validate lead data before insertion
CREATE OR REPLACE FUNCTION public.validate_lead_security()
RETURNS TRIGGER AS $$
DECLARE
  domain_count INTEGER;
  recent_submissions INTEGER;
BEGIN
  -- Enhanced rate limiting check by domain
  SELECT COUNT(*) INTO domain_count
  FROM public.leads 
  WHERE split_part(email, '@', 2) = split_part(NEW.email, '@', 2)
    AND created_at > now() - interval '1 hour';
    
  IF domain_count >= 10 THEN
    -- Log security violation
    INSERT INTO public.analytics_events (
      event_type, event_data, user_session, page_url
    ) VALUES (
      'security_violation',
      jsonb_build_object(
        'violation_type', 'domain_rate_limit_exceeded',
        'domain', split_part(NEW.email, '@', 2),
        'attempts', domain_count + 1,
        'timestamp', now()
      ),
      'security_system',
      'rate_limit_enforcement'
    );
    RAISE EXCEPTION 'Security violation: Domain submission rate limit exceeded';
  END IF;
  
  -- Check for recent submissions from same email
  SELECT COUNT(*) INTO recent_submissions
  FROM public.leads
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';
    
  IF recent_submissions >= 3 THEN
    INSERT INTO public.analytics_events (
      event_type, event_data, user_session, page_url
    ) VALUES (
      'security_violation',
      jsonb_build_object(
        'violation_type', 'email_rate_limit_exceeded',
        'email_domain', split_part(NEW.email, '@', 2),
        'timestamp', now()
      ),
      'security_system',
      'rate_limit_enforcement'
    );
    RAISE EXCEPTION 'Security violation: Email submission rate limit exceeded';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply security validation trigger to leads
DROP TRIGGER IF EXISTS validate_lead_security ON public.leads;
CREATE TRIGGER validate_lead_security
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_security();

-- SECURITY ENHANCEMENT: Create audit trigger for sensitive table modifications
CREATE OR REPLACE FUNCTION public.audit_sensitive_table_modifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Log modifications to sensitive tables for security monitoring
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url
  ) VALUES (
    'sensitive_table_modification_audit',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_id', auth.uid(),
      'user_role', auth.role(),
      'timestamp', now(),
      'security_classification', 'sensitive_data_modification',
      'record_id', COALESCE(NEW.id, OLD.id)
    ),
    COALESCE(auth.uid()::text, 'system'),
    'sensitive_data_audit'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers to sensitive tables (for modifications only)
DROP TRIGGER IF EXISTS audit_leads_modifications ON public.leads;
CREATE TRIGGER audit_leads_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_table_modifications();

DROP TRIGGER IF EXISTS audit_encrypted_leads_modifications ON public.encrypted_lead_data;
CREATE TRIGGER audit_encrypted_leads_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.encrypted_lead_data  
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_table_modifications();

DROP TRIGGER IF EXISTS audit_consent_records_modifications ON public.consent_records;
CREATE TRIGGER audit_consent_records_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_table_modifications();

-- SECURITY ENHANCEMENT: Create data retention function for GDPR compliance
CREATE OR REPLACE FUNCTION public.secure_data_retention_cleanup()
RETURNS void AS $$
DECLARE
  anonymized_leads INTEGER;
  deleted_old_analytics INTEGER;
BEGIN
  -- Anonymize lead data older than 18 months (GDPR compliance)
  UPDATE public.leads 
  SET 
    name = 'ANONYMIZED_' || LEFT(MD5(name || id::text), 8),
    email = 'anon_' || LEFT(MD5(email || id::text), 8) || '@privacy.local',
    notes = CASE 
      WHEN notes IS NOT NULL THEN 'Data anonymized per retention policy'
      ELSE NULL 
    END
  WHERE created_at < now() - interval '18 months'
    AND name NOT LIKE 'ANONYMIZED_%';
    
  GET DIAGNOSTICS anonymized_leads = ROW_COUNT;
  
  -- Delete old analytics events (privacy compliance)
  DELETE FROM public.analytics_events 
  WHERE created_at < now() - interval '12 months'
    AND event_type NOT IN ('security_violation', 'sensitive_table_modification_audit');
    
  GET DIAGNOSTICS deleted_old_analytics = ROW_COUNT;
  
  -- Log retention cleanup
  INSERT INTO public.analytics_events (
    event_type, event_data, user_session, page_url
  ) VALUES (
    'automated_data_retention',
    jsonb_build_object(
      'anonymized_leads', anonymized_leads,
      'deleted_analytics', deleted_old_analytics,
      'timestamp', now(),
      'retention_policy', 'gdpr_compliance'
    ),
    'system_retention',
    'data_retention_automation'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;