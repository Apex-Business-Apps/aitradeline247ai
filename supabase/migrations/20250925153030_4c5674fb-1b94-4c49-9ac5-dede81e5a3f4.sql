-- 🔒 CRITICAL FIX 3: Enhanced Lead Data Protection
-- Add field-level encryption for sensitive lead information

-- Create encrypted leads backup with field-level encryption
CREATE TABLE IF NOT EXISTS public.encrypted_lead_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  encrypted_email text NOT NULL,
  encrypted_name text NOT NULL,
  encrypted_company text NOT NULL,
  encrypted_notes text,
  encryption_key_id text NOT NULL DEFAULT 'default_key_v1',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);

-- Enable RLS on encrypted lead data
ALTER TABLE public.encrypted_lead_data ENABLE ROW LEVEL SECURITY;

-- Only admins can access encrypted lead data
CREATE POLICY "Only admins can access encrypted lead data" ON public.encrypted_lead_data
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to encrypt and store sensitive lead data
CREATE OR REPLACE FUNCTION public.encrypt_lead_sensitive_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key text;
BEGIN
  -- Generate encryption key based on lead ID (in production, use proper key management)
  v_encryption_key := 'lead_key_' || NEW.id::text;
  
  -- Insert encrypted backup of sensitive data
  INSERT INTO public.encrypted_lead_data (
    lead_id,
    encrypted_email,
    encrypted_name,
    encrypted_company,
    encrypted_notes
  ) VALUES (
    NEW.id,
    encode(encrypt(NEW.email::bytea, v_encryption_key, 'aes'), 'base64'),
    encode(encrypt(NEW.name::bytea, v_encryption_key, 'aes'), 'base64'),
    encode(encrypt(NEW.company::bytea, v_encryption_key, 'aes'), 'base64'),
    CASE 
      WHEN NEW.notes IS NOT NULL THEN 
        encode(encrypt(NEW.notes::bytea, v_encryption_key, 'aes'), 'base64')
      ELSE NULL 
    END
  ) ON CONFLICT (lead_id) DO UPDATE SET
    encrypted_email = EXCLUDED.encrypted_email,
    encrypted_name = EXCLUDED.encrypted_name,
    encrypted_company = EXCLUDED.encrypted_company,
    encrypted_notes = EXCLUDED.encrypted_notes;
  
  RETURN NEW;
END $$;

-- Create trigger for lead data encryption (safe trigger that won't cause recursion)
CREATE TRIGGER encrypt_lead_data_trigger
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_lead_sensitive_data();

-- 🛡️ MEDIUM FIX 4: Enhanced Privacy Controls with Automatic IP Anonymization
-- Create automated privacy cleanup job

CREATE OR REPLACE FUNCTION public.automated_privacy_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize IP addresses older than 24 hours
  UPDATE public.analytics_events 
  SET ip_address = 'anonymized_' || left(md5(ip_address || id::text), 8)
  WHERE created_at < now() - interval '24 hours' 
    AND ip_address IS NOT NULL 
    AND ip_address NOT LIKE 'anonymized_%';
    
  -- Anonymize user agents older than 7 days
  UPDATE public.analytics_events 
  SET user_agent = 'anonymized_agent'
  WHERE created_at < now() - interval '7 days' 
    AND user_agent IS NOT NULL 
    AND user_agent != 'anonymized_agent';
    
  -- Delete analytics events older than 90 days (GDPR compliance)
  DELETE FROM public.analytics_events 
  WHERE created_at < now() - interval '90 days';
  
  -- Revoke expired session tokens
  UPDATE public.encrypted_session_tokens 
  SET is_revoked = true 
  WHERE expires_at < now() AND NOT is_revoked;
  
  -- Clean up old revoked tokens (older than 30 days)
  DELETE FROM public.encrypted_session_tokens 
  WHERE is_revoked = true AND created_at < now() - interval '30 days';
END $$;

-- 🔍 MEDIUM FIX 5: Enhanced Security Monitoring
-- Create comprehensive security audit function

CREATE OR REPLACE FUNCTION public.log_security_audit_event(
  p_event_type text,
  p_severity text DEFAULT 'medium',
  p_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use the safe analytics function to prevent recursion
  PERFORM public.safe_analytics_insert_with_circuit_breaker(
    'security_audit_enhanced',
    jsonb_build_object(
      'audit_event_type', p_event_type,
      'severity', p_severity,
      'user_id', COALESCE(p_user_id, auth.uid()),
      'user_role', auth.role(),
      'timestamp', now(),
      'details', COALESCE(p_details, '{}'::jsonb),
      'security_classification', 'audit_critical'
    ),
    'security_audit_system',
    'security_monitoring'
  );
END $$;

-- Grant necessary permissions for security functions
GRANT EXECUTE ON FUNCTION public.safe_analytics_insert_with_circuit_breaker TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_encrypted_session_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.automated_privacy_cleanup TO authenticated;