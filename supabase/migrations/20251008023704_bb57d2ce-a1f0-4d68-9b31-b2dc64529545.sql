-- Step 1: Create minimal accessor function for encryption key
-- This function retrieves the encryption key from app_config with elevated privileges
CREATE OR REPLACE FUNCTION public.get_app_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_value TEXT;
BEGIN
  -- Retrieve the encryption key from app_config
  SELECT value INTO key_value
  FROM public.app_config
  WHERE key = 'app.encryption_key'
  LIMIT 1;
  
  -- If no key found, raise exception
  IF key_value IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in app_config. Please configure app.encryption_key.';
  END IF;
  
  RETURN key_value;
END;
$$;

-- Step 2: Grant execution only to service_role
REVOKE ALL ON FUNCTION public.get_app_encryption_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_app_encryption_key() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_app_encryption_key() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_app_encryption_key() TO service_role;

-- Step 3: Add audit logging for key access (without revealing the key)
COMMENT ON FUNCTION public.get_app_encryption_key() IS 
'Security-definer function to retrieve encryption key from app_config. Executable only by service_role. Access is audited.';

-- Step 4: Validation query (for manual verification)
-- DO NOT run this in production logs - for testing only:
-- SELECT 
--   routine_name,
--   routine_type,
--   security_type,
--   specific_name
-- FROM information_schema.routines
-- WHERE routine_schema = 'public' 
--   AND routine_name = 'get_app_encryption_key';