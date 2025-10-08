-- Core encryption/decryption functions using accessor
-- These are PLACEHOLDER implementations - actual pgcrypto will be added when key is configured

-- Decrypt PII with IV (logged version for production)
CREATE OR REPLACE FUNCTION public.decrypt_pii_with_iv_logged(
  encrypted_data TEXT,
  iv_data TEXT,
  appointment_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_value TEXT;
  encryption_key TEXT;
BEGIN
  -- Validate inputs
  IF encrypted_data IS NULL OR iv_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get key via accessor (audited)
  encryption_key := public.get_app_encryption_key();
  
  IF encryption_key IS NULL THEN
    INSERT INTO public.encryption_errors (
      error_type,
      appointment_id,
      function_name,
      error_message
    ) VALUES (
      'missing_key',
      appointment_id,
      'decrypt_pii_with_iv_logged',
      'Encryption key not found'
    );
    RETURN NULL;
  END IF;
  
  -- TODO: Replace with actual pgcrypto decryption when ready
  -- decrypted_value := pgp_sym_decrypt_bytea(encrypted_data::bytea, encryption_key, 'cipher-algo=aes256');
  
  -- PLACEHOLDER: Return encrypted data as-is until crypto is implemented
  decrypted_value := encrypted_data;
  
  RETURN decrypted_value;
  
EXCEPTION WHEN OTHERS THEN
  -- Log decryption failure
  INSERT INTO public.encryption_errors (
    error_type,
    appointment_id,
    function_name,
    error_message,
    metadata
  ) VALUES (
    'decrypt_failed',
    appointment_id,
    'decrypt_pii_with_iv_logged',
    SQLERRM,
    jsonb_build_object(
      'sqlstate', SQLSTATE,
      'encrypted_length', LENGTH(encrypted_data),
      'iv_length', LENGTH(iv_data)
    )
  );
  RETURN NULL;
END;
$$;

-- Grant to service_role only
GRANT EXECUTE ON FUNCTION public.decrypt_pii_with_iv_logged(TEXT, TEXT, UUID) TO service_role;

-- Encrypt PII function (uses accessor)
CREATE OR REPLACE FUNCTION public.encrypt_pii_field(
  plaintext_value TEXT,
  iv_value TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encrypted_value TEXT;
  encryption_key TEXT;
BEGIN
  IF plaintext_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get key via accessor
  encryption_key := public.get_app_encryption_key();
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not available';
  END IF;
  
  -- TODO: Replace with actual pgcrypto encryption
  -- encrypted_value := pgp_sym_encrypt_bytea(plaintext_value::bytea, encryption_key, 'cipher-algo=aes256');
  
  -- PLACEHOLDER: Return plaintext until crypto is ready
  encrypted_value := plaintext_value;
  
  RETURN encrypted_value;
  
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.encryption_errors (
    error_type,
    function_name,
    error_message,
    metadata
  ) VALUES (
    'encrypt_failed',
    'encrypt_pii_field',
    SQLERRM,
    jsonb_build_object(
      'sqlstate', SQLSTATE,
      'plaintext_length', LENGTH(plaintext_value)
    )
  );
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.encrypt_pii_field(TEXT, TEXT) TO service_role;

-- Batch encryption function
CREATE OR REPLACE FUNCTION public.batch_encrypt_appointments(batch_size INTEGER DEFAULT 500)
RETURNS TABLE (
  encrypted_count INTEGER,
  failed_count INTEGER,
  batch_duration_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  success_count INTEGER := 0;
  fail_count INTEGER := 0;
  rec RECORD;
  new_iv TEXT;
BEGIN
  start_time := clock_timestamp();
  
  -- Process unencrypted appointments
  FOR rec IN 
    SELECT id, email, e164, first_name
    FROM public.appointments
    WHERE email_encrypted IS NULL 
      AND pii_iv IS NULL
      AND (email IS NOT NULL OR e164 IS NOT NULL OR first_name IS NOT NULL)
    LIMIT batch_size
  LOOP
    BEGIN
      -- Generate unique IV for this record
      new_iv := gen_random_uuid()::TEXT;
      
      -- Encrypt fields that exist
      UPDATE public.appointments
      SET 
        email_encrypted = CASE 
          WHEN rec.email IS NOT NULL 
          THEN public.encrypt_pii_field(rec.email, new_iv)
          ELSE NULL 
        END,
        e164_encrypted = CASE 
          WHEN rec.e164 IS NOT NULL 
          THEN public.encrypt_pii_field(rec.e164, new_iv)
          ELSE NULL 
        END,
        first_name_encrypted = CASE 
          WHEN rec.first_name IS NOT NULL 
          THEN public.encrypt_pii_field(rec.first_name, new_iv)
          ELSE NULL 
        END,
        pii_iv = new_iv
      WHERE id = rec.id;
      
      success_count := success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log failure but continue
      INSERT INTO public.encryption_errors (
        error_type,
        appointment_id,
        function_name,
        error_message,
        metadata
      ) VALUES (
        'batch_encrypt_failed',
        rec.id,
        'batch_encrypt_appointments',
        SQLERRM,
        jsonb_build_object(
          'sqlstate', SQLSTATE,
          'batch_size', batch_size
        )
      );
      
      fail_count := fail_count + 1;
    END;
  END LOOP;
  
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    success_count,
    fail_count,
    EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.batch_encrypt_appointments(INTEGER) TO service_role;

-- Trigger function for auto-encryption on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.encrypt_appointment_pii()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_iv TEXT;
BEGIN
  -- Only encrypt if PII fields are provided and not already encrypted
  IF (NEW.email IS NOT NULL OR NEW.e164 IS NOT NULL OR NEW.first_name IS NOT NULL) 
     AND NEW.pii_iv IS NULL THEN
    
    -- Generate unique IV
    new_iv := gen_random_uuid()::TEXT;
    
    -- Encrypt each PII field that exists
    IF NEW.email IS NOT NULL THEN
      NEW.email_encrypted := public.encrypt_pii_field(NEW.email, new_iv);
    END IF;
    
    IF NEW.e164 IS NOT NULL THEN
      NEW.e164_encrypted := public.encrypt_pii_field(NEW.e164, new_iv);
    END IF;
    
    IF NEW.first_name IS NOT NULL THEN
      NEW.first_name_encrypted := public.encrypt_pii_field(NEW.first_name, new_iv);
    END IF;
    
    -- Store IV
    NEW.pii_iv := new_iv;
  END IF;
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow insert to proceed (graceful degradation)
  INSERT INTO public.encryption_errors (
    error_type,
    appointment_id,
    function_name,
    error_message,
    metadata
  ) VALUES (
    'trigger_encrypt_failed',
    NEW.id,
    'encrypt_appointment_pii',
    SQLERRM,
    jsonb_build_object(
      'sqlstate', SQLSTATE,
      'operation', TG_OP
    )
  );
  
  -- Return NEW to allow record insertion (plaintext fallback)
  RETURN NEW;
END;
$$;

-- Create trigger (DISABLED by default for safety)
DROP TRIGGER IF EXISTS encrypt_appointment_pii ON public.appointments;

CREATE TRIGGER encrypt_appointment_pii
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_appointment_pii();

-- DISABLE trigger initially - enable only after testing
ALTER TABLE public.appointments DISABLE TRIGGER encrypt_appointment_pii;

-- Add comment documenting trigger state
COMMENT ON TRIGGER encrypt_appointment_pii ON public.appointments IS 
'Auto-encryption trigger for PII fields. DISABLED by default. Enable after staging tests pass.
To enable: ALTER TABLE public.appointments ENABLE TRIGGER encrypt_appointment_pii;
To disable: ALTER TABLE public.appointments DISABLE TRIGGER encrypt_appointment_pii;';