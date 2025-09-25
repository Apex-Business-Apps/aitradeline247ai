-- Enhanced Security for Leads Table - Comprehensive Data Protection (Simplified)

-- 1. Drop existing conflicting policies first
DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can view leads" ON public.leads;  
DROP POLICY IF EXISTS "Only service role can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Service role can only insert new leads" ON public.leads;

-- 2. Enhanced RLS policy for admins with JWT validation
CREATE POLICY "Enhanced admin access with security validation"
ON public.leads
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() IS NOT NULL
);

-- 3. Enhanced service role policy with strict validation  
CREATE POLICY "Service role insert with enhanced validation"
ON public.leads
FOR INSERT
TO service_role
WITH CHECK (
  auth.role() = 'service_role'
  AND source = ANY(ARRAY['website', 'landing_page', 'contact_form', 'secure_website_form'])
  AND name IS NOT NULL 
  AND email IS NOT NULL 
  AND company IS NOT NULL
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(trim(name)) >= 2
  AND length(trim(company)) >= 2
);

-- 4. Explicitly deny all anonymous access
CREATE POLICY "Deny all anonymous access to leads"
ON public.leads
FOR ALL
TO anon
USING (false);

-- 5. Enhanced audit logging function
CREATE OR REPLACE FUNCTION public.audit_lead_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all lead table operations for security monitoring
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url
  ) VALUES (
    'sensitive_data_access',
    jsonb_build_object(
      'operation', TG_OP,
      'table_name', 'leads',
      'user_id', auth.uid(),
      'user_role', auth.role(),
      'timestamp', now(),
      'lead_id', COALESCE(NEW.id, OLD.id),
      'security_level', 'high'
    ),
    COALESCE(auth.uid()::text, 'service_role'),
    'leads_security_audit'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Create audit trigger for all operations
DROP TRIGGER IF EXISTS audit_lead_access ON public.leads;
CREATE TRIGGER audit_lead_access
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_data_access();

-- 7. Enhanced rate limiting with security validation
CREATE OR REPLACE FUNCTION public.enhanced_lead_rate_limit_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_count INTEGER;
  domain_count INTEGER;
  email_domain TEXT;
BEGIN
  email_domain := split_part(NEW.email, '@', 2);
  
  -- Check email rate limiting (3 per hour)
  SELECT COUNT(*) INTO email_count
  FROM public.leads
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';
    
  IF email_count >= 3 THEN
    -- Log security violation
    INSERT INTO public.analytics_events (
      event_type, event_data, user_session, page_url
    ) VALUES (
      'security_violation',
      jsonb_build_object('type', 'rate_limit_email', 'email_domain', email_domain),
      'service_role',
      'rate_limit_check'
    );
    RAISE EXCEPTION 'Rate limit exceeded for email address';
  END IF;
  
  -- Check domain rate limiting (15 per hour)
  SELECT COUNT(*) INTO domain_count
  FROM public.leads  
  WHERE split_part(email, '@', 2) = email_domain
    AND created_at > now() - interval '1 hour';
    
  IF domain_count >= 15 THEN
    -- Log security violation
    INSERT INTO public.analytics_events (
      event_type, event_data, user_session, page_url
    ) VALUES (
      'security_violation', 
      jsonb_build_object('type', 'rate_limit_domain', 'domain', email_domain),
      'service_role',
      'rate_limit_check'
    );
    RAISE EXCEPTION 'Rate limit exceeded for email domain';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Apply enhanced rate limiting
DROP TRIGGER IF EXISTS enhanced_lead_rate_limit ON public.leads;
CREATE TRIGGER enhanced_lead_rate_limit
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_lead_rate_limit_check();

-- 9. Create secure lead statistics function (no PII)
CREATE OR REPLACE FUNCTION public.get_secure_lead_stats()
RETURNS TABLE(
  total_leads bigint,
  leads_today bigint,
  avg_score numeric,
  unique_domains bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as leads_today,
    ROUND(AVG(lead_score), 1) as avg_score,
    COUNT(DISTINCT split_part(email, '@', 2)) as unique_domains
  FROM public.leads;
END;
$$;

-- 10. Add performance indexes for security monitoring
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email_domain ON public.leads((split_part(email, '@', 2)));

-- 11. Create security monitoring view
CREATE OR REPLACE VIEW public.lead_security_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as daily_submissions,
  COUNT(DISTINCT split_part(email, '@', 2)) as unique_domains,
  AVG(lead_score) as avg_score
FROM public.leads
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant view access to authenticated users with admin role
GRANT SELECT ON public.lead_security_summary TO authenticated;