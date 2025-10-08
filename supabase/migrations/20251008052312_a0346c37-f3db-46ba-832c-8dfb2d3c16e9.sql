
-- ============================================================================
-- SECTION 1 ENCRYPTION INFRASTRUCTURE (ATOMIC)
-- Project: hysvqdwmhxnblxfqnszn
-- Purpose: Key storage, audit tables, IV column, accessor, trigger
-- ============================================================================

-- 1) KEY STORAGE TABLE: app_config
-- Stores single active symmetric key for pgcrypto AES-256-CBC
-- Key provisioning: out-of-band (manual INSERT via service_role; never logged)
CREATE TABLE IF NOT EXISTS public.app_config (
  key_name TEXT PRIMARY KEY,
  key_value TEXT NOT NULL, -- Opaque/encrypted representation
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMPTZ
);

-- Enable RLS on app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Grant only service_role read/write access
CREATE POLICY "service_role_full_access_app_config"
  ON public.app_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Explicitly deny all other roles
CREATE POLICY "deny_anon_app_config"
  ON public.app_config
  FOR ALL
  USING (false);

-- 2) AUDIT TABLE: encryption_key_audit
-- Records all key access/rotation events
CREATE TABLE IF NOT EXISTS public.encryption_key_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_role TEXT NOT NULL,
  action TEXT NOT NULL, -- 'read', 'write', 'rotate'
  from_version INTEGER,
  to_version INTEGER,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on encryption_key_audit
ALTER TABLE public.encryption_key_audit ENABLE ROW LEVEL SECURITY;

-- Service role can write; admins can read
CREATE POLICY "service_role_insert_key_audit"
  ON public.encryption_key_audit
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_read_key_audit"
  ON public.encryption_key_audit
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) ERROR TABLE: encryption_errors
-- Records encryption/decryption failures
CREATE TABLE IF NOT EXISTS public.encryption_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  function_name TEXT NOT NULL,
  error_type TEXT NOT NULL,
  appointment_id UUID, -- Nullable; references appointments
  error_message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on encryption_errors
ALTER TABLE public.encryption_errors ENABLE ROW LEVEL SECURITY;

-- Service role can write; admins can read
CREATE POLICY "service_role_insert_encryption_errors"
  ON public.encryption_errors
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_read_encryption_errors"
  ON public.encryption_errors
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) IV STORAGE: Add pii_iv to appointments
-- Unique per-row IV for AES-256-CBC
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS pii_iv TEXT;

-- 5) KEY ACCESSOR: get_app_encryption_key()
-- Only interface to retrieve encryption key; audits every access
CREATE OR REPLACE FUNCTION public.get_app_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
  v_version INTEGER;
BEGIN
  -- Retrieve active key (only one row expected with key_name='primary')
  SELECT key_value, version INTO v_key, v_version
  FROM public.app_config
  WHERE key_name = 'primary'
  LIMIT 1;
  
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;
  
  -- Audit successful key access
  INSERT INTO public.encryption_key_audit (
    user_role,
    action,
    to_version,
    reason
  ) VALUES (
    auth.role()::TEXT,
    'read',
    v_version,
    'Accessed via get_app_encryption_key()'
  );
  
  RETURN v_key;
END;
$$;

-- Grant EXECUTE only to service_role
GRANT EXECUTE ON FUNCTION public.get_app_encryption_key() TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_app_encryption_key() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_app_encryption_key() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_app_encryption_key() FROM authenticated;

-- 6) AUTO-ENCRYPTION TRIGGER FUNCTION: encrypt_appointment_pii()
-- Encrypts PII on INSERT/UPDATE; graceful degradation on error
CREATE OR REPLACE FUNCTION public.encrypt_appointment_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_iv TEXT;
BEGIN
  -- Generate unique IV for this row
  v_iv := gen_random_uuid()::TEXT;
  
  -- Encrypt email if present and not already encrypted
  IF NEW.email IS NOT NULL AND (NEW.email_encrypted IS NULL OR NEW.pii_iv IS NULL) THEN
    BEGIN
      NEW.email_encrypted := public.encrypt_pii_field(NEW.email, v_iv);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.encryption_errors (
        function_name,
        error_type,
        appointment_id,
        error_message,
        metadata
      ) VALUES (
        'encrypt_appointment_pii',
        'email_encryption_failed',
        NEW.id,
        SQLERRM,
        jsonb_build_object('sqlstate', SQLSTATE)
      );
      -- Allow write to proceed with plaintext
    END;
  END IF;
  
  -- Encrypt e164 if present and not already encrypted
  IF NEW.e164 IS NOT NULL AND (NEW.e164_encrypted IS NULL OR NEW.pii_iv IS NULL) THEN
    BEGIN
      NEW.e164_encrypted := public.encrypt_pii_field(NEW.e164, v_iv);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.encryption_errors (
        function_name,
        error_type,
        appointment_id,
        error_message,
        metadata
      ) VALUES (
        'encrypt_appointment_pii',
        'e164_encryption_failed',
        NEW.id,
        SQLERRM,
        jsonb_build_object('sqlstate', SQLSTATE)
      );
    END;
  END IF;
  
  -- Encrypt first_name if present and not already encrypted
  IF NEW.first_name IS NOT NULL AND (NEW.first_name_encrypted IS NULL OR NEW.pii_iv IS NULL) THEN
    BEGIN
      NEW.first_name_encrypted := public.encrypt_pii_field(NEW.first_name, v_iv);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.encryption_errors (
        function_name,
        error_type,
        appointment_id,
        error_message,
        metadata
      ) VALUES (
        'encrypt_appointment_pii',
        'first_name_encryption_failed',
        NEW.id,
        SQLERRM,
        jsonb_build_object('sqlstate', SQLSTATE)
      );
    END;
  END IF;
  
  -- Store IV if any encryption occurred
  IF NEW.email_encrypted IS NOT NULL OR NEW.e164_encrypted IS NOT NULL OR NEW.first_name_encrypted IS NOT NULL THEN
    NEW.pii_iv := v_iv;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7) CREATE TRIGGER (DISABLED BY DEFAULT)
-- To enable: ALTER TABLE public.appointments ENABLE TRIGGER encrypt_appointment_pii_trigger;
-- To disable: ALTER TABLE public.appointments DISABLE TRIGGER encrypt_appointment_pii_trigger;
DROP TRIGGER IF EXISTS encrypt_appointment_pii_trigger ON public.appointments;
CREATE TRIGGER encrypt_appointment_pii_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_appointment_pii();

-- Disable trigger by default (staging/testing only)
ALTER TABLE public.appointments DISABLE TRIGGER encrypt_appointment_pii_trigger;

COMMENT ON TRIGGER encrypt_appointment_pii_trigger ON public.appointments IS 
  'Auto-encrypts PII fields on INSERT/UPDATE. DISABLED by default. Enable: ALTER TABLE appointments ENABLE TRIGGER encrypt_appointment_pii_trigger;';

-- ============================================================================
-- END SECTION 1 INFRASTRUCTURE
-- ============================================================================
