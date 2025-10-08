-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing placeholder functions
DROP FUNCTION IF EXISTS public.encrypt_pii_field(text, text);
DROP FUNCTION IF EXISTS public.decrypt_pii_with_iv_logged(text, text, uuid);

-- Create real encryption function using pgcrypto AES-256-CBC
CREATE OR REPLACE FUNCTION public.encrypt_pii_field(
  plaintext_value TEXT,
  iv_seed TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  encrypted_bytes BYTEA;
  encryption_key TEXT;
  key_bytes BYTEA;
  iv_bytes BYTEA;
BEGIN
  -- Validate input
  IF plaintext_value IS NULL OR iv_seed IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get encryption key via secure accessor
  encryption_key := public.get_app_encryption_key();
  
  IF encryption_key IS NULL THEN
    INSERT INTO public.encryption_errors (
      error_type,
      function_name,
      error_message
    ) VALUES (
      'missing_key',
      'encrypt_pii_field',
      'Encryption key not found'
    );
    RAISE EXCEPTION 'Encryption key not available';
  END IF;
  
  -- Derive 32-byte key from encryption_key using SHA-256
  key_bytes := digest(encryption_key, 'sha256');
  
  -- Derive 16-byte IV from iv_seed using SHA-256 (take first 16 bytes)
  iv_bytes := substring(digest(iv_seed, 'sha256'), 1, 16);
  
  -- Encrypt using AES-256-CBC
  encrypted_bytes := encrypt_iv(
    plaintext_value::BYTEA,
    key_bytes,
    iv_bytes,
    'aes-cbc/pad:pkcs'
  );
  
  -- Return base64-encoded ciphertext for storage
  RETURN encode(encrypted_bytes, 'base64');
  
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
$function$;

-- Create real decryption function with audit logging
CREATE OR REPLACE FUNCTION public.decrypt_pii_with_iv_logged(
  encrypted_data TEXT,
  iv_data TEXT,
  appointment_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  decrypted_bytes BYTEA;
  encryption_key TEXT;
  key_bytes BYTEA;
  iv_bytes BYTEA;
  encrypted_bytes BYTEA;
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
  
  -- Derive 32-byte key from encryption_key using SHA-256
  key_bytes := digest(encryption_key, 'sha256');
  
  -- Derive 16-byte IV from iv_data using SHA-256 (same as encryption)
  iv_bytes := substring(digest(iv_data, 'sha256'), 1, 16);
  
  -- Decode base64 ciphertext
  encrypted_bytes := decode(encrypted_data, 'base64');
  
  -- Decrypt using AES-256-CBC
  decrypted_bytes := decrypt_iv(
    encrypted_bytes,
    key_bytes,
    iv_bytes,
    'aes-cbc/pad:pkcs'
  );
  
  -- Convert bytes to text
  RETURN convert_from(decrypted_bytes, 'UTF8');
  
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
$function$;

-- Add encryption validation test function
CREATE OR REPLACE FUNCTION public.test_encryption_roundtrip()
RETURNS TABLE(
  test_name TEXT,
  passed BOOLEAN,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  test_plaintext TEXT := 'test@example.com';
  test_iv TEXT := gen_random_uuid()::TEXT;
  encrypted TEXT;
  decrypted TEXT;
BEGIN
  -- Test 1: Encryption produces non-null output
  encrypted := public.encrypt_pii_field(test_plaintext, test_iv);
  RETURN QUERY SELECT 
    'Encryption produces output'::TEXT,
    encrypted IS NOT NULL,
    'Encrypted: ' || COALESCE(LEFT(encrypted, 20) || '...', 'NULL');
  
  -- Test 2: Encryption changes the value
  RETURN QUERY SELECT 
    'Encryption transforms data'::TEXT,
    encrypted != test_plaintext,
    'Original != Encrypted: ' || (encrypted != test_plaintext)::TEXT;
  
  -- Test 3: Decryption works
  decrypted := public.decrypt_pii_with_iv_logged(encrypted, test_iv);
  RETURN QUERY SELECT 
    'Decryption produces output'::TEXT,
    decrypted IS NOT NULL,
    'Decrypted: ' || COALESCE(decrypted, 'NULL');
  
  -- Test 4: Round-trip matches
  RETURN QUERY SELECT 
    'Round-trip integrity'::TEXT,
    decrypted = test_plaintext,
    'Match: ' || (decrypted = test_plaintext)::TEXT || ' (Expected: ' || test_plaintext || ', Got: ' || COALESCE(decrypted, 'NULL') || ')';
  
  -- Test 5: Different IV produces different ciphertext
  DECLARE
    encrypted2 TEXT := public.encrypt_pii_field(test_plaintext, gen_random_uuid()::TEXT);
  BEGIN
    RETURN QUERY SELECT 
      'Different IV produces different ciphertext'::TEXT,
      encrypted != encrypted2,
      'Ciphertexts differ: ' || (encrypted != encrypted2)::TEXT;
  END;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.encrypt_pii_field(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_pii_with_iv_logged(TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.test_encryption_roundtrip() TO service_role;

-- Add comment documenting the encryption approach
COMMENT ON FUNCTION public.encrypt_pii_field IS 'Real AES-256-CBC encryption using pgcrypto. IV is derived from UUID seed for consistency.';
COMMENT ON FUNCTION public.decrypt_pii_with_iv_logged IS 'Real AES-256-CBC decryption with audit logging. Logs all decryption attempts and failures.';
COMMENT ON FUNCTION public.test_encryption_roundtrip IS 'Validation test for encryption/decryption round-trip integrity. Run this to verify crypto is working correctly.';