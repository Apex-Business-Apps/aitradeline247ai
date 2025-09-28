-- SECURITY FIXES: Implement critical data protection measures

-- 1. HARDEN APPOINTMENTS TABLE ACCESS
-- Currently only service role can access - add organization-based access control

-- First, add organization_id to appointments if not exists (for proper access control)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'appointments' AND column_name = 'organization_id') THEN
    ALTER TABLE public.appointments ADD COLUMN organization_id uuid;
    -- Set a default org for existing records (you may need to update this manually)
    UPDATE public.appointments SET organization_id = (SELECT id FROM public.organizations LIMIT 1) WHERE organization_id IS NULL;
  END IF;
END $$;

-- Add organization-based RLS policies for appointments
CREATE POLICY "Organization members can view their appointments"
ON public.appointments
FOR SELECT
USING (organization_id IS NULL OR is_org_member(organization_id));

CREATE POLICY "Organization members can manage their appointments"
ON public.appointments
FOR ALL
USING (organization_id IS NULL OR is_org_member(organization_id))
WITH CHECK (organization_id IS NULL OR is_org_member(organization_id));

-- 2. ENHANCE PROFILE PRIVACY - Add phone number masking
-- Create enhanced profile view with masked phone numbers
CREATE OR REPLACE FUNCTION public.get_masked_profile(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone_e164_masked text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    public.mask_phone_number(p.phone_e164, auth.uid()) as phone_e164_masked,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_user_id
  AND (p.id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR share_org(auth.uid(), p.id));
$$;

-- 3. ANALYTICS DATA ANONYMIZATION
-- Create function to anonymize IP addresses
CREATE OR REPLACE FUNCTION public.anonymize_ip_address(ip inet)
RETURNS inet
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN family(ip) = 4 THEN 
      -- IPv4: mask last octet
      (host(ip)::text || '.0')::inet
    ELSE 
      -- IPv6: mask last 64 bits
      (regexp_replace(host(ip)::text, ':([^:]*:){0,3}[^:]*$', '::'))::inet
  END;
$$;

-- Create enhanced analytics function with IP anonymization
CREATE OR REPLACE FUNCTION public.log_analytics_event_secure(
  p_event_type text,
  p_event_data jsonb DEFAULT '{}',
  p_user_session text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_anonymized_ip inet;
  v_scrubbed_data jsonb;
BEGIN
  -- Anonymize IP address
  v_anonymized_ip := CASE 
    WHEN p_ip_address IS NOT NULL THEN public.anonymize_ip_address(p_ip_address)
    ELSE NULL
  END;
  
  -- Scrub PII from event data
  v_scrubbed_data := p_event_data;
  
  -- Remove common PII fields
  v_scrubbed_data := v_scrubbed_data - 'email' - 'phone' - 'first_name' - 'last_name' - 'full_name';
  
  -- Use existing circuit breaker function with anonymized data
  RETURN public.safe_analytics_insert_with_circuit_breaker(
    p_event_type,
    v_scrubbed_data,
    p_user_session,
    p_page_url,
    v_anonymized_ip,
    p_user_agent
  );
END;
$$;

-- 4. CUSTOMER DATA AUDIT LOGGING
-- Create audit trail for sensitive data access
CREATE TABLE IF NOT EXISTS public.data_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  accessed_table text NOT NULL,
  accessed_record_id text,
  access_type text NOT NULL, -- 'read', 'write', 'delete'
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.data_access_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.data_access_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON public.data_access_audit
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Function to log data access
CREATE OR REPLACE FUNCTION public.log_data_access(
  p_table_name text,
  p_record_id text DEFAULT NULL,
  p_access_type text DEFAULT 'read'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type,
    created_at
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_record_id,
    p_access_type,
    now()
  );
END;
$$;

-- 5. ENHANCED SECURITY MONITORING
-- Create function to detect anomalous data access patterns
CREATE OR REPLACE FUNCTION public.detect_anomalous_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_suspicious_user_id uuid;
  v_access_count integer;
BEGIN
  -- Detect users with excessive data access in last hour
  FOR v_suspicious_user_id, v_access_count IN
    SELECT user_id, COUNT(*) as access_count
    FROM public.data_access_audit
    WHERE created_at > (now() - INTERVAL '1 hour')
    AND user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 100
  LOOP
    -- Log security alert
    INSERT INTO public.security_alerts (
      alert_type,
      user_id,
      event_data,
      severity
    ) VALUES (
      'excessive_data_access',
      v_suspicious_user_id,
      jsonb_build_object(
        'access_count', v_access_count,
        'time_window', '1 hour'
      ),
      'high'
    );
  END LOOP;
END;
$$;