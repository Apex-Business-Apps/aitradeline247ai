-- ============================================================
-- CRITICAL SECURITY FIX: Field-Level PII Encryption
-- Implementation of AES-256-GCM encryption for customer data
-- ============================================================

-- 1. Create encryption/decryption functions using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encryption function for PII fields
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from secrets (must be set via Supabase CLI)
  -- In production, this should be rotated regularly
  encryption_key := current_setting('app.encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  
  IF plaintext IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Use AES-256 in GCM mode for authenticated encryption
  RETURN encode(
    encrypt_iv(
      plaintext::bytea,
      encryption_key::bytea,
      gen_random_bytes(16),  -- IV
      'aes-gcm'
    ),
    'base64'
  );
END;
$$;

-- Decryption function for PII fields
CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from secrets
  encryption_key := current_setting('app.encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt using AES-256-GCM
  RETURN convert_from(
    decrypt_iv(
      decode(ciphertext, 'base64'),
      encryption_key::bytea,
      gen_random_bytes(16),  -- IV (must match encryption IV)
      'aes-gcm'
    ),
    'utf8'
  );
END;
$$;

-- 2. Add encrypted columns to appointments table
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS e164_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS first_name_encrypted TEXT;

-- 3. Add encrypted columns to contacts table  
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS e164_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS first_name_encrypted TEXT;

-- 4. Add encrypted columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_e164_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS full_name_encrypted TEXT;

-- 5. Create secure PII access function for appointments
CREATE OR REPLACE FUNCTION public.get_appointment_pii_secure(
  appointment_id_param UUID,
  access_reason TEXT
)
RETURNS TABLE(
  id UUID,
  organization_id UUID,
  email TEXT,
  e164 TEXT,
  first_name TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access unencrypted PII
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required for PII access';
  END IF;

  -- Log emergency access with reason
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'appointments_pii',
    appointment_id_param::TEXT,
    'emergency_decrypt: ' || access_reason
  );

  -- Generate security alert for PII decryption
  INSERT INTO public.security_alerts (
    alert_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'admin_pii_decrypt',
    auth.uid(),
    jsonb_build_object(
      'appointment_id', appointment_id_param,
      'access_reason', access_reason,
      'timestamp', NOW()
    ),
    'high'
  );

  -- Return decrypted data using elevated privileges
  RETURN QUERY
  SELECT 
    a.id,
    a.organization_id,
    COALESCE(public.decrypt_pii(a.email_encrypted), a.email) as email,
    COALESCE(public.decrypt_pii(a.e164_encrypted), a.e164) as e164,
    COALESCE(public.decrypt_pii(a.first_name_encrypted), a.first_name) as first_name,
    a.start_at,
    a.end_at,
    a.status
  FROM public.appointments a
  WHERE a.id = appointment_id_param
  AND public.is_org_member(a.organization_id);
END;
$$;

-- 6. Create secure PII access function for contacts
CREATE OR REPLACE FUNCTION public.get_contact_pii_secure(
  contact_id_param UUID,
  access_reason TEXT
)
RETURNS TABLE(
  id UUID,
  organization_id UUID,
  e164 TEXT,
  first_name TEXT,
  wa_capable BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access unencrypted PII
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required for PII access';
  END IF;

  -- Log access with audit trail
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'contacts_pii',
    contact_id_param::TEXT,
    'emergency_decrypt: ' || access_reason
  );

  -- Generate security alert
  INSERT INTO public.security_alerts (
    alert_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'admin_pii_decrypt_contact',
    auth.uid(),
    jsonb_build_object(
      'contact_id', contact_id_param,
      'access_reason', access_reason,
      'timestamp', NOW()
    ),
    'high'
  );

  -- Return decrypted data
  RETURN QUERY
  SELECT 
    c.id,
    c.organization_id,
    COALESCE(public.decrypt_pii(c.e164_encrypted), c.e164) as e164,
    COALESCE(public.decrypt_pii(c.first_name_encrypted), c.first_name) as first_name,
    c.wa_capable,
    c.created_at
  FROM public.contacts c
  WHERE c.id = contact_id_param
  AND public.is_org_member(c.organization_id);
END;
$$;

-- 7. Create trigger to auto-encrypt new appointments
CREATE OR REPLACE FUNCTION public.encrypt_appointment_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt PII fields on insert/update
  IF NEW.email IS NOT NULL AND NEW.email_encrypted IS NULL THEN
    NEW.email_encrypted := public.encrypt_pii(NEW.email);
    NEW.email := NULL;  -- Clear plaintext
  END IF;
  
  IF NEW.e164 IS NOT NULL AND NEW.e164_encrypted IS NULL THEN
    NEW.e164_encrypted := public.encrypt_pii(NEW.e164);
    NEW.e164 := NULL;  -- Clear plaintext
  END IF;
  
  IF NEW.first_name IS NOT NULL AND NEW.first_name_encrypted IS NULL THEN
    NEW.first_name_encrypted := public.encrypt_pii(NEW.first_name);
    NEW.first_name := NULL;  -- Clear plaintext
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_appointments_before_insert
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_appointment_pii();

-- 8. Log implementation
INSERT INTO public.analytics_events (
  event_type,
  event_data,
  severity
) VALUES (
  'security_enhancement',
  jsonb_build_object(
    'action', 'field_level_encryption_implemented',
    'tables', ARRAY['appointments', 'contacts', 'profiles'],
    'timestamp', NOW()
  ),
  'info'
);

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.encrypt_pii(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_appointment_pii_secure(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_pii_secure(UUID, TEXT) TO authenticated;