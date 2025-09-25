-- Clean Security Enhancement for Leads Table

-- 1. Drop ALL existing policies first to ensure clean slate
DROP POLICY IF EXISTS "Enhanced admin access with security validation" ON public.leads;
DROP POLICY IF EXISTS "Service role insert with enhanced validation" ON public.leads;
DROP POLICY IF EXISTS "Deny all anonymous access to leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;
DROP POLICY IF EXISTS "Only admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Only service role can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Service role can only insert new leads" ON public.leads;
DROP POLICY IF EXISTS "Deny all unauthorized access" ON public.leads;

-- 2. Create comprehensive admin access policy
CREATE POLICY "Secure admin full access"
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

-- 3. Secure service role insert policy
CREATE POLICY "Secure service role insert only"
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

-- 4. Explicit deny for anonymous users
CREATE POLICY "Block all anonymous access"
ON public.leads
FOR ALL
TO anon
USING (false);

-- 5. Enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.log_lead_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all operations on sensitive lead data
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url
  ) VALUES (
    'lead_data_security_event',
    jsonb_build_object(
      'operation', TG_OP,
      'user_id', auth.uid(),
      'user_role', auth.role(),
      'timestamp', now(),
      'lead_id', COALESCE(NEW.id, OLD.id),
      'classification', 'sensitive_pii_access'
    ),
    COALESCE(auth.uid()::text, 'system'),
    'security_audit'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Apply security monitoring trigger
DROP TRIGGER IF EXISTS log_lead_security ON public.leads;
CREATE TRIGGER log_lead_security
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_security_event();

-- 7. Enhanced rate limiting with violation logging
CREATE OR REPLACE FUNCTION public.secure_lead_rate_limiting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_submissions INTEGER;
  domain_submissions INTEGER;
  email_domain TEXT;
BEGIN
  email_domain := split_part(NEW.email, '@', 2);
  
  -- Email-based rate limiting
  SELECT COUNT(*) INTO email_submissions
  FROM public.leads
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';
    
  IF email_submissions >= 3 THEN
    INSERT INTO public.analytics_events (
      event_type, event_data, user_session, page_url
    ) VALUES (
      'security_violation',
      jsonb_build_object(
        'violation_type', 'email_rate_limit_exceeded',
        'email_domain', email_domain,
        'attempts', email_submissions + 1
      ),
      'security_system',
      'rate_limit_enforcement'
    );
    RAISE EXCEPTION 'Security violation: Email rate limit exceeded';
  END IF;
  
  -- Domain-based rate limiting
  SELECT COUNT(*) INTO domain_submissions
  FROM public.leads  
  WHERE split_part(email, '@', 2) = email_domain
    AND created_at > now() - interval '1 hour';
    
  IF domain_submissions >= 15 THEN
    INSERT INTO public.analytics_events (
      event_type, event_data, user_session, page_url
    ) VALUES (
      'security_violation',
      jsonb_build_object(
        'violation_type', 'domain_rate_limit_exceeded',
        'domain', email_domain,
        'attempts', domain_submissions + 1
      ),
      'security_system',
      'rate_limit_enforcement'
    );
    RAISE EXCEPTION 'Security violation: Domain rate limit exceeded';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Apply rate limiting trigger
DROP TRIGGER IF EXISTS secure_rate_limiting ON public.leads;
CREATE TRIGGER secure_rate_limiting
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.secure_lead_rate_limiting();

-- 9. Create admin-only statistics function
CREATE OR REPLACE FUNCTION public.get_lead_security_metrics()
RETURNS TABLE(
  total_leads bigint,
  recent_leads bigint,
  average_score numeric,
  domain_diversity bigint,
  security_events bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict admin-only access
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'SECURITY_DENIED: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM public.leads WHERE created_at > now() - interval '24 hours') as recent_leads,
    (SELECT ROUND(AVG(lead_score), 1) FROM public.leads) as average_score,
    (SELECT COUNT(DISTINCT split_part(email, '@', 2)) FROM public.leads) as domain_diversity,
    (SELECT COUNT(*) FROM public.analytics_events WHERE event_type = 'security_violation') as security_events;
END;
$$;

-- 10. Add optimized indexes for security queries
CREATE INDEX IF NOT EXISTS idx_leads_security_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_security_email ON public.leads(email);

-- 11. Create non-PII security dashboard view
DROP VIEW IF EXISTS public.lead_security_dashboard;
CREATE VIEW public.lead_security_dashboard AS
SELECT 
  DATE_TRUNC('hour', created_at) as time_period,
  COUNT(*) as submission_count,
  COUNT(DISTINCT split_part(email, '@', 2)) as unique_domains,
  ROUND(AVG(lead_score), 1) as avg_lead_score,
  CASE 
    WHEN COUNT(*) > 10 THEN 'HIGH_ACTIVITY'
    WHEN COUNT(*) > 3 THEN 'NORMAL_ACTIVITY'
    ELSE 'LOW_ACTIVITY'
  END as activity_level
FROM public.leads
WHERE created_at > now() - interval '48 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY time_period DESC;