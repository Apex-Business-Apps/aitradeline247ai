-- ============================================
-- SECURITY HARDENING: Phase 2
-- ============================================

-- 1. Add indexing to user_roles for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- 2. Create moderator-friendly has_role function with fallback
CREATE OR REPLACE FUNCTION public.has_role_with_fallback(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If user_roles table is empty (bootstrap phase), allow admin access
  SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN 
      (_role = 'admin'::app_role)
    ELSE
      EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
  END
$$;

-- 3. Create batch encryption migration function
CREATE OR REPLACE FUNCTION public.batch_encrypt_appointments(
  p_batch_size INT DEFAULT 100,
  p_encryption_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key TEXT;
  v_processed INT := 0;
  v_failed INT := 0;
  v_row RECORD;
  v_encrypted_data JSONB;
  v_iv BYTEA;
BEGIN
  -- Get encryption key from config or parameter
  v_encryption_key := COALESCE(
    p_encryption_key,
    current_setting('app.encryption_key', true),
    (SELECT value::text FROM public.encryption_config WHERE key = 'current_key' LIMIT 1)
  );
  
  IF v_encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found. Set app.encryption_key or pass as parameter.';
  END IF;
  
  -- Process appointments where plaintext exists but cipher is null
  FOR v_row IN 
    SELECT id, email, e164, first_name
    FROM public.appointments
    WHERE (email_encrypted IS NULL AND email IS NOT NULL)
       OR (e164_encrypted IS NULL AND e164 IS NOT NULL)
       OR (first_name_encrypted IS NULL AND first_name IS NOT NULL)
    LIMIT p_batch_size
  LOOP
    BEGIN
      -- Generate new IV for this record
      v_iv := gen_random_bytes(16);
      
      -- Encrypt email if exists
      IF v_row.email IS NOT NULL AND v_row.email != '' THEN
        UPDATE public.appointments
        SET email_encrypted = encode(
              encrypt(v_row.email::bytea, v_encryption_key::bytea, 'aes'),
              'base64'
            ),
            pii_iv = v_iv
        WHERE id = v_row.id;
      END IF;
      
      -- Encrypt phone if exists
      IF v_row.e164 IS NOT NULL AND v_row.e164 != '' THEN
        UPDATE public.appointments
        SET e164_encrypted = encode(
              encrypt(v_row.e164::bytea, v_encryption_key::bytea, 'aes'),
              'base64'
            ),
            pii_iv = COALESCE(pii_iv, v_iv)
        WHERE id = v_row.id;
      END IF;
      
      -- Encrypt first_name if exists
      IF v_row.first_name IS NOT NULL AND v_row.first_name != '' THEN
        UPDATE public.appointments
        SET first_name_encrypted = encode(
              encrypt(v_row.first_name::bytea, v_encryption_key::bytea, 'aes'),
              'base64'
            ),
            pii_iv = COALESCE(pii_iv, v_iv)
        WHERE id = v_row.id;
      END IF;
      
      v_processed := v_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      
      -- Log encryption failure
      INSERT INTO public.security_alerts (
        alert_type,
        event_data,
        severity
      ) VALUES (
        'encryption_failure',
        jsonb_build_object(
          'appointment_id', v_row.id,
          'error', SQLERRM,
          'timestamp', NOW()
        ),
        'high'
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed', v_processed,
    'failed', v_failed,
    'batch_size', p_batch_size
  );
END;
$$;

-- 4. Create encryption monitoring function
CREATE OR REPLACE FUNCTION public.check_encryption_health()
RETURNS TABLE(
  total_records BIGINT,
  encrypted_records BIGINT,
  failed_records BIGINT,
  missing_iv_records BIGINT,
  health_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE email_encrypted IS NOT NULL OR e164_encrypted IS NOT NULL) as encrypted,
      COUNT(*) FILTER (WHERE 
        (email IS NOT NULL AND email_encrypted IS NULL) OR
        (e164 IS NOT NULL AND e164_encrypted IS NULL) OR
        (first_name IS NOT NULL AND first_name_encrypted IS NULL)
      ) as failed,
      COUNT(*) FILTER (WHERE 
        (email_encrypted IS NOT NULL OR e164_encrypted IS NOT NULL) AND pii_iv IS NULL
      ) as missing_iv
    FROM public.appointments
  )
  SELECT
    stats.total,
    stats.encrypted,
    stats.failed,
    stats.missing_iv,
    CASE
      WHEN stats.missing_iv > 0 THEN 'CRITICAL: Missing IVs detected'
      WHEN stats.failed > stats.total * 0.1 THEN 'WARNING: >10% records not encrypted'
      WHEN stats.encrypted = 0 THEN 'INFO: Encryption not yet enabled'
      ELSE 'HEALTHY'
    END as health_status
  FROM stats;
END;
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_role_with_fallback(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.batch_encrypt_appointments(INT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_encryption_health() TO authenticated, service_role;