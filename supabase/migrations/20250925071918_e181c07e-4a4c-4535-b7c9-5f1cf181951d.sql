-- Enhanced RLS policies for leads table security - SIMPLIFIED VERSION
-- This fixes the security vulnerability by adding comprehensive data protection

-- Drop existing overly permissive service role policy if it exists
DROP POLICY IF EXISTS "Service role can manage leads" ON public.leads;

-- Add specific, restrictive policies for service role
CREATE POLICY "Service role can only insert new leads" 
ON public.leads 
FOR INSERT 
TO service_role
WITH CHECK (
  -- Only allow inserting leads from lead capture forms
  -- Verify the source is from authorized channels
  source IN ('website', 'landing_page', 'contact_form', 'secure_website_form')
  AND name IS NOT NULL 
  AND email IS NOT NULL 
  AND company IS NOT NULL
);

-- Create audit logging trigger for all lead access
CREATE OR REPLACE FUNCTION public.audit_lead_access()
RETURNS trigger AS $$
DECLARE
  lead_id_val UUID;
  email_domain_val TEXT;
BEGIN
  -- Get the appropriate values based on operation
  IF TG_OP = 'DELETE' THEN
    lead_id_val := OLD.id;
    email_domain_val := split_part(OLD.email, '@', 2);
  ELSE 
    lead_id_val := NEW.id;
    email_domain_val := split_part(NEW.email, '@', 2);
  END IF;

  -- Log all access to leads table for security monitoring
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url
  ) VALUES (
    'lead_data_access',
    jsonb_build_object(
      'operation', TG_OP,
      'lead_id', lead_id_val,
      'user_id', auth.uid(),
      'role', auth.role(),
      'timestamp', now(),
      'email_domain', email_domain_val
    ),
    COALESCE(auth.uid()::text, 'service_role'),
    'leads_table_access'
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit trigger to leads table
CREATE TRIGGER audit_lead_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_lead_access();

-- Add rate limiting for lead insertions (prevent spam/abuse)
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit()
RETURNS trigger AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check for rate limiting on lead submissions
  SELECT COUNT(*) INTO recent_count
  FROM public.leads
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';
    
  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many submissions from this email address';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply rate limiting trigger
CREATE TRIGGER check_lead_rate_limit_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.check_lead_rate_limit();

-- Add data validation trigger
CREATE OR REPLACE FUNCTION public.validate_lead_data()
RETURNS trigger AS $$
BEGIN
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Sanitize input data
  NEW.name = TRIM(NEW.name);
  NEW.email = LOWER(TRIM(NEW.email));
  NEW.company = TRIM(NEW.company);
  
  -- Validate required fields
  IF LENGTH(NEW.name) < 2 OR LENGTH(NEW.company) < 2 THEN
    RAISE EXCEPTION 'Name and company must be at least 2 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply validation trigger
CREATE TRIGGER validate_lead_data_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_data();

-- Create function to anonymize old lead data (GDPR compliance)
CREATE OR REPLACE FUNCTION public.anonymize_old_leads()
RETURNS void AS $$
DECLARE
  anonymized_count INTEGER;
BEGIN
  -- Anonymize leads older than 2 years
  UPDATE public.leads 
  SET 
    name = 'ANONYMIZED_' || LEFT(MD5(name || id::text), 8),
    email = 'anon_' || LEFT(MD5(email || id::text), 8) || '@anonymized.local',
    notes = CASE 
      WHEN notes IS NOT NULL THEN 'Data anonymized per retention policy'
      ELSE NULL 
    END
  WHERE created_at < now() - interval '2 years'
    AND name NOT LIKE 'ANONYMIZED_%';
    
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
    
  -- Log anonymization activity
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url
  ) VALUES (
    'data_anonymization',
    jsonb_build_object(
      'table', 'leads',
      'anonymized_count', anonymized_count,
      'timestamp', now(),
      'retention_policy', '2_years'
    ),
    'system',
    'data_retention_job'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create index for performance on frequently queried fields
CREATE INDEX IF NOT EXISTS idx_leads_email_created ON public.leads(email, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON public.leads(status, created_at);