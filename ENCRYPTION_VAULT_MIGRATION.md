# Vault Migration Path (Future)

## Overview

This document outlines the migration path from `app_config` key storage to Supabase Vault. The architecture is designed with this abstraction in mind - only the `get_app_encryption_key()` accessor needs to change.

## Current State vs. Target State

### Current Architecture ✅
```
Encryption Functions
        ↓
get_app_encryption_key() ← Accessor (abstraction layer)
        ↓
app_config table (key storage)
```

### Target Architecture (Vault) 🎯
```
Encryption Functions (unchanged)
        ↓
get_app_encryption_key() ← Accessor (only this changes)
        ↓
Supabase Vault (secure key storage)
```

## Prerequisites for Vault Migration

### Before You Begin
- [ ] Supabase Vault extension available on your plan
- [ ] Vault extension enabled in Supabase dashboard
- [ ] Current encryption system stable (100% coverage)
- [ ] Database backup completed
- [ ] Team briefed on migration
- [ ] Maintenance window scheduled

### Verify Vault Availability

```sql
-- Check if Vault extension can be enabled
SELECT * FROM pg_available_extensions WHERE name = 'vault';

-- If available, enable it
CREATE EXTENSION IF NOT EXISTS vault;

-- Verify Vault tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'vault' 
AND tablename IN ('secrets', 'decrypted_secrets');
```

## Migration Steps

### Step 1: Enable Vault Extension

```sql
-- Enable Supabase Vault
CREATE EXTENSION IF NOT EXISTS vault;

-- Verify Vault is ready
SELECT 
  extname,
  extversion
FROM pg_extension
WHERE extname = 'vault';

-- Expected: Returns vault extension info
```

### Step 2: Migrate Key to Vault (Without Logging Plaintext)

```sql
-- Securely migrate encryption key from app_config to Vault
-- This runs in a single transaction to avoid key exposure
DO $$
DECLARE
  existing_key TEXT;
  vault_secret_id UUID;
BEGIN
  -- Step A: Retrieve key from app_config (without logging)
  SELECT value INTO existing_key
  FROM public.app_config
  WHERE key = 'app.encryption_key'
  LIMIT 1;
  
  -- Step B: Verify key exists
  IF existing_key IS NULL THEN
    RAISE EXCEPTION 'No encryption key found in app_config to migrate';
  END IF;
  
  -- Step C: Insert into Vault secrets table
  INSERT INTO vault.secrets (name, secret)
  VALUES ('app.encryption_key', existing_key)
  ON CONFLICT (name) DO UPDATE
  SET 
    secret = EXCLUDED.secret,
    updated_at = NOW()
  RETURNING id INTO vault_secret_id;
  
  -- Step D: Clear the key from app_config (key now only in Vault)
  UPDATE public.app_config
  SET value = NULL
  WHERE key = 'app.encryption_key';
  
  -- Step E: Log success WITHOUT revealing key (only record secret ID)
  RAISE NOTICE 'Encryption key migrated to Vault (secret_id: %)', vault_secret_id;
  
  -- Step F: Log in audit table
  INSERT INTO public.encryption_key_audit (
    access_type,
    accessed_by_role,
    success,
    key_version,
    metadata
  ) VALUES (
    'migration',
    'admin',
    true,
    'vault',
    jsonb_build_object(
      'vault_secret_id', vault_secret_id,
      'migrated_from', 'app_config',
      'migration_timestamp', NOW()
    )
  );
END;
$$;

-- Verify migration
SELECT 
  id,
  name,
  created_at,
  updated_at
FROM vault.secrets
WHERE name = 'app.encryption_key';

-- Expected: Shows vault secret (NOT the plaintext key)

-- Verify app_config key is cleared
SELECT 
  key,
  value IS NULL as key_cleared,
  metadata
FROM public.app_config
WHERE key = 'app.encryption_key';

-- Expected: key_cleared = true
```

### Step 3: Update Accessor to Read from Vault

```sql
-- Update get_app_encryption_key() to use Vault instead of app_config
CREATE OR REPLACE FUNCTION public.get_app_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, vault  -- Add vault to search_path
AS $$
DECLARE
  key_value TEXT;
  current_role TEXT;
BEGIN
  current_role := current_setting('role', true);
  
  -- Retrieve the encryption key from Vault's decrypted view
  -- vault.decrypted_secrets automatically decrypts the secret
  SELECT decrypted_secret INTO key_value
  FROM vault.decrypted_secrets
  WHERE name = 'app.encryption_key'
  LIMIT 1;
  
  -- If no key found in Vault, raise exception
  IF key_value IS NULL THEN
    -- Log failure
    INSERT INTO public.encryption_key_audit (
      access_type,
      accessed_by_role,
      success,
      error_message
    ) VALUES (
      'read',
      current_role,
      false,
      'Encryption key not found in Vault'
    );
    
    RAISE EXCEPTION 'Encryption key not found in Vault. Please configure app.encryption_key in Vault storage.';
  END IF;
  
  -- Log successful access (without revealing the key)
  INSERT INTO public.encryption_key_audit (
    access_type,
    accessed_by_role,
    success,
    key_version,
    metadata
  ) VALUES (
    'read',
    current_role,
    true,
    'vault',
    jsonb_build_object(
      'key_length', LENGTH(key_value),
      'source', 'vault.decrypted_secrets'
    )
  );
  
  RETURN key_value;
END;
$$;

-- Update function comment/documentation
COMMENT ON FUNCTION public.get_app_encryption_key() IS 
'Security-definer function to retrieve encryption key from Supabase Vault (not app_config). Executable only by service_role. All access is audited. Key source: vault.decrypted_secrets.';

-- Verify function updated
SELECT 
  routine_name,
  routine_type,
  security_type,
  specific_name
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'get_app_encryption_key';
```

### Step 4: Test Vault Integration

```sql
-- Test 1: Verify accessor retrieves key from Vault
DO $$
DECLARE
  test_key TEXT;
BEGIN
  -- This should now read from Vault, not app_config
  test_key := public.get_app_encryption_key();
  
  IF test_key IS NULL OR LENGTH(test_key) < 10 THEN
    RAISE EXCEPTION 'Vault accessor test failed: Invalid key retrieved';
  END IF;
  
  RAISE NOTICE 'Vault accessor test PASSED (key length: %)', LENGTH(test_key);
END $$;

-- Test 2: Verify audit log shows Vault source
SELECT 
  access_type,
  accessed_by_role,
  success,
  key_version,
  metadata->>'source' as key_source,
  access_timestamp
FROM public.encryption_key_audit
WHERE access_type = 'read'
ORDER BY access_timestamp DESC
LIMIT 5;

-- Expected: key_source = 'vault.decrypted_secrets'

-- Test 3: Attempt decryption (smoke test)
SELECT 
  id,
  public.decrypt_pii_with_iv_logged(email_encrypted, pii_iv, id) IS NOT NULL as decrypt_works
FROM public.appointments
WHERE email_encrypted IS NOT NULL
LIMIT 5;

-- Expected: All decrypt_works = true

-- Test 4: Check for decryption errors
SELECT * FROM public.encryption_errors
WHERE error_timestamp > NOW() - INTERVAL '5 minutes';

-- Expected: No errors (or only expected test errors)
```

### Step 5: Monitoring Post-Migration

```sql
-- Monitor Vault key access for 24 hours
SELECT 
  DATE_TRUNC('hour', access_timestamp) as hour,
  COUNT(*) as access_count,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed
FROM public.encryption_key_audit
WHERE key_version = 'vault'
  AND access_timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', access_timestamp)
ORDER BY hour DESC;

-- Check for any Vault-related errors
SELECT * FROM public.encryption_errors
WHERE error_message ILIKE '%vault%'
  AND error_timestamp > NOW() - INTERVAL '24 hours';
```

## Rollback to app_config (If Needed)

If Vault migration encounters issues:

```sql
-- Emergency Rollback: Restore key to app_config from Vault
DO $$
DECLARE
  vault_key TEXT;
BEGIN
  -- Step A: Retrieve key from Vault
  SELECT decrypted_secret INTO vault_key
  FROM vault.decrypted_secrets
  WHERE name = 'app.encryption_key'
  LIMIT 1;
  
  IF vault_key IS NULL THEN
    RAISE EXCEPTION 'Rollback failed: Key not found in Vault';
  END IF;
  
  -- Step B: Restore to app_config
  UPDATE public.app_config
  SET value = vault_key
  WHERE key = 'app.encryption_key';
  
  IF NOT FOUND THEN
    INSERT INTO public.app_config (key, value)
    VALUES ('app.encryption_key', vault_key);
  END IF;
  
  -- Step C: Log rollback
  INSERT INTO public.encryption_key_audit (
    access_type,
    accessed_by_role,
    success,
    key_version,
    metadata
  ) VALUES (
    'migration',
    'admin',
    true,
    'rollback_to_app_config',
    jsonb_build_object(
      'reason', 'Emergency rollback from Vault',
      'timestamp', NOW()
    )
  );
  
  RAISE NOTICE 'Rollback complete: Key restored to app_config';
END $$;

-- Revert accessor function to app_config version
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
  -- Back to reading from app_config
  SELECT value INTO key_value
  FROM public.app_config
  WHERE key = 'app.encryption_key'
  LIMIT 1;
  
  IF key_value IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in app_config';
  END IF;
  
  RETURN key_value;
END;
$$;

-- Remove Vault secret (optional - only if rolling back permanently)
-- DELETE FROM vault.secrets WHERE name = 'app.encryption_key';
```

## Benefits of Vault Migration

### Security Improvements
✅ **Dedicated secrets management** - Vault designed specifically for secrets
✅ **Encrypted at rest** - Vault encrypts secrets with managed encryption keys
✅ **Access auditing** - Built-in audit trail for secret access
✅ **Key rotation support** - Easier key versioning and rotation
✅ **Separation of concerns** - Secrets isolated from application config

### Compliance Benefits
✅ **SOC 2 compliance** - Vault meets security certification requirements
✅ **GDPR alignment** - Better encryption key management
✅ **Audit trail** - Complete history of key access

### Operational Benefits
✅ **Easier key rotation** - Vault handles versioning automatically
✅ **Multi-environment support** - Different keys per environment
✅ **Disaster recovery** - Vault backups integrated with Supabase

## Post-Migration Cleanup

After 30 days of successful Vault operation:

```sql
-- Archive old app_config key (already NULL, but good practice)
UPDATE public.app_config
SET metadata = metadata || jsonb_build_object(
  'deprecated', true,
  'migrated_to_vault', NOW(),
  'deprecated_reason', 'Key migrated to Supabase Vault for enhanced security'
)
WHERE key = 'app.encryption_key';

-- Update documentation
COMMENT ON TABLE public.app_config IS 
'Application configuration table. Note: Encryption keys migrated to Supabase Vault. Use get_app_encryption_key() accessor function.';

-- Log final migration status
INSERT INTO public.encryption_key_audit (
  access_type,
  accessed_by_role,
  success,
  key_version,
  metadata
) VALUES (
  'migration',
  'admin',
  true,
  'vault_stable',
  jsonb_build_object(
    'phase', 'migration_complete',
    'vault_stable_days', 30,
    'app_config_deprecated', true,
    'recommendation', 'Remove app_config key references from documentation'
  )
);
```

## Summary

**Key Takeaway:** The abstraction layer (`get_app_encryption_key()`) means that:
- ✅ All encryption/decryption functions remain unchanged
- ✅ Only the accessor function needs to be updated
- ✅ Data encryption/decryption continues to work seamlessly
- ✅ Migration is transparent to the application layer
- ✅ Rollback is straightforward if needed

This architecture enables future improvements (like Vault) without disrupting the core encryption logic.

