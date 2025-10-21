# Encryption Key Rotation Procedure

## Overview

Key rotation is a critical security practice that limits the exposure window if a key is compromised. This document outlines the safe procedure for rotating the encryption key while maintaining data access.

## Prerequisites

- [ ] New encryption key generated (secure random, 256-bit minimum)
- [ ] Current key backed up securely (offline storage)
- [ ] Database backup completed (full backup before rotation)
- [ ] Team briefed on rotation window
- [ ] Rollback plan ready
- [ ] Low-traffic maintenance window scheduled

## Key Rotation Strategy: Dual-Key Approach

We use a **dual-key decryption** strategy to ensure zero downtime:
1. Generate new key, keep old key accessible
2. Re-encrypt all data with new key
3. Update accessor to use new key for new encryptions
4. Verify all data decryptable with new key
5. Retire old key after confirmation period

## Phase 1: Prepare New Key

### Step 1.1: Generate New Key

```bash
# Generate secure random key (256-bit)
openssl rand -base64 32

# Store this securely - DO NOT commit to git
# Add to password manager or secrets vault
```

### Step 1.2: Stage New Key in Database

```sql
-- Insert new key with version tracking
INSERT INTO public.app_config (key, value, metadata)
VALUES (
  'app.encryption_key_v2',
  'YOUR_NEW_KEY_HERE', -- Replace with actual new key
  jsonb_build_object(
    'version', 2,
    'created_at', NOW(),
    'rotation_reason', 'Scheduled rotation',
    'previous_version', 1
  )
);

-- Verify insertion
SELECT 
  key,
  LENGTH(value) as key_length,
  metadata->>'version' as version,
  metadata->>'created_at' as created_at
FROM public.app_config
WHERE key LIKE 'app.encryption_key%'
ORDER BY key;

-- Expected: Two keys shown (v1 and v2)
```

### Step 1.3: Log Rotation Start

```sql
INSERT INTO public.encryption_key_audit (
  access_type,
  accessed_by_role,
  success,
  key_version,
  metadata
) VALUES (
  'rotation',
  'admin',
  true,
  'v2',
  jsonb_build_object(
    'phase', 'rotation_start',
    'old_version', 'v1',
    'new_version', 'v2'
  )
);
```

## Phase 2: Create Dual-Key Decryption Function

```sql
-- Create enhanced decryption function that tries both keys
CREATE OR REPLACE FUNCTION public.decrypt_pii_with_dual_key(
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
  primary_key TEXT;
  fallback_key TEXT;
BEGIN
  -- Validate inputs
  IF encrypted_data IS NULL OR iv_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get primary key (new key)
  SELECT value INTO primary_key
  FROM public.app_config
  WHERE key = 'app.encryption_key_v2'
  LIMIT 1;
  
  -- Try decryption with primary key first
  BEGIN
    -- TODO: Replace with actual pgcrypto decryption
    -- decrypted_value := pgp_sym_decrypt_bytea(encrypted_data::bytea, primary_key, 'cipher-algo=aes256');
    decrypted_value := encrypted_data; -- Placeholder
    RETURN decrypted_value;
  EXCEPTION WHEN OTHERS THEN
    -- Primary key failed, try fallback key
    NULL;
  END;
  
  -- If primary key fails, try fallback (old key)
  SELECT value INTO fallback_key
  FROM public.app_config
  WHERE key = 'app.encryption_key'
  LIMIT 1;
  
  IF fallback_key IS NOT NULL THEN
    BEGIN
      -- TODO: Replace with actual pgcrypto decryption
      -- decrypted_value := pgp_sym_decrypt_bytea(encrypted_data::bytea, fallback_key, 'cipher-algo=aes256');
      decrypted_value := encrypted_data; -- Placeholder
      
      -- Log fallback usage
      INSERT INTO public.encryption_errors (
        error_type,
        appointment_id,
        function_name,
        error_message,
        metadata
      ) VALUES (
        'fallback_key_used',
        appointment_id,
        'decrypt_pii_with_dual_key',
        'Primary key failed, fallback key succeeded',
        jsonb_build_object(
          'encrypted_length', LENGTH(encrypted_data),
          'requires_reencryption', true
        )
      );
      
      RETURN decrypted_value;
    EXCEPTION WHEN OTHERS THEN
      -- Both keys failed
      INSERT INTO public.encryption_errors (
        error_type,
        appointment_id,
        function_name,
        error_message,
        metadata
      ) VALUES (
        'decrypt_failed_both_keys',
        appointment_id,
        'decrypt_pii_with_dual_key',
        SQLERRM,
        jsonb_build_object(
          'sqlstate', SQLSTATE,
          'tried_both_keys', true
        )
      );
      RETURN NULL;
    END;
  END IF;
  
  -- No fallback key available
  RETURN NULL;
END;
$$;

-- Grant to service_role
GRANT EXECUTE ON FUNCTION public.decrypt_pii_with_dual_key(TEXT, TEXT, UUID) TO service_role;
```

## Phase 3: Re-encrypt All Data with New Key

### Step 3.1: Create Re-encryption Function

```sql
CREATE OR REPLACE FUNCTION public.reencrypt_with_new_key(batch_size INTEGER DEFAULT 500)
RETURNS TABLE (
  reencrypted_count INTEGER,
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
  new_key TEXT;
  decrypted_email TEXT;
  decrypted_e164 TEXT;
  decrypted_first_name TEXT;
  new_encrypted_email TEXT;
  new_encrypted_e164 TEXT;
  new_encrypted_first_name TEXT;
  new_iv TEXT;
BEGIN
  start_time := clock_timestamp();
  
  -- Get new key
  SELECT value INTO new_key
  FROM public.app_config
  WHERE key = 'app.encryption_key_v2'
  LIMIT 1;
  
  IF new_key IS NULL THEN
    RAISE EXCEPTION 'New encryption key (v2) not found';
  END IF;
  
  -- Process batch
  FOR rec IN 
    SELECT id, email_encrypted, e164_encrypted, first_name_encrypted, pii_iv
    FROM public.appointments
    WHERE email_encrypted IS NOT NULL
      AND pii_iv IS NOT NULL
      -- Mark records that haven't been re-encrypted yet
      AND NOT COALESCE((pii_iv LIKE 'v2:%'), false)
    LIMIT batch_size
  LOOP
    BEGIN
      -- Decrypt with dual-key function (handles both old and new keys)
      decrypted_email := public.decrypt_pii_with_dual_key(rec.email_encrypted, rec.pii_iv, rec.id);
      decrypted_e164 := public.decrypt_pii_with_dual_key(rec.e164_encrypted, rec.pii_iv, rec.id);
      decrypted_first_name := public.decrypt_pii_with_dual_key(rec.first_name_encrypted, rec.pii_iv, rec.id);
      
      -- Generate new IV for v2
      new_iv := 'v2:' || gen_random_uuid()::TEXT;
      
      -- Re-encrypt with new key
      -- TODO: Replace with actual pgcrypto encryption
      new_encrypted_email := decrypted_email; -- Placeholder
      new_encrypted_e164 := decrypted_e164; -- Placeholder
      new_encrypted_first_name := decrypted_first_name; -- Placeholder
      
      -- Update record with new encryption
      UPDATE public.appointments
      SET 
        email_encrypted = new_encrypted_email,
        e164_encrypted = new_encrypted_e164,
        first_name_encrypted = new_encrypted_first_name,
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
        'reencryption_failed',
        rec.id,
        'reencrypt_with_new_key',
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
  
  -- Return summary
  RETURN QUERY SELECT 
    success_count,
    fail_count,
    EXTRACT(EPOCH FROM (end_time - start_time))::NUMERIC;
END;
$$;

-- Grant to service_role
GRANT EXECUTE ON FUNCTION public.reencrypt_with_new_key(INTEGER) TO service_role;
```

### Step 3.2: Execute Re-encryption in Batches

```sql
-- Monitor progress with this query first
SELECT 
  COUNT(*) as total_encrypted,
  COUNT(*) FILTER (WHERE pii_iv LIKE 'v2:%') as reencrypted_v2,
  COUNT(*) FILTER (WHERE pii_iv NOT LIKE 'v2:%') as pending_reencryption,
  ROUND(
    (COUNT(*) FILTER (WHERE pii_iv LIKE 'v2:%'))::NUMERIC / 
    NULLIF(COUNT(*), 0)::NUMERIC * 100, 
    2
  ) as percent_complete
FROM public.appointments
WHERE email_encrypted IS NOT NULL;

-- Run re-encryption in batches (500 at a time)
-- Repeat until all records are re-encrypted
DO $$
DECLARE
  batch_result RECORD;
  total_reencrypted INTEGER := 0;
  total_failed INTEGER := 0;
  iteration INTEGER := 0;
BEGIN
  LOOP
    iteration := iteration + 1;
    
    -- Run batch
    SELECT * INTO batch_result FROM public.reencrypt_with_new_key(500);
    
    total_reencrypted := total_reencrypted + batch_result.reencrypted_count;
    total_failed := total_failed + batch_result.failed_count;
    
    RAISE NOTICE 'Batch %: Reencrypted %, Failed %, Duration: %s',
      iteration,
      batch_result.reencrypted_count,
      batch_result.failed_count,
      batch_result.batch_duration_seconds;
    
    -- Exit if no more records to process
    EXIT WHEN batch_result.reencrypted_count = 0;
    
    -- Small pause between batches
    PERFORM pg_sleep(5);
  END LOOP;
  
  RAISE NOTICE 'Re-encryption complete! Total: %, Failed: %', 
    total_reencrypted, 
    total_failed;
END $$;

-- Verify completion
SELECT 
  COUNT(*) as total_encrypted,
  COUNT(*) FILTER (WHERE pii_iv LIKE 'v2:%') as reencrypted_v2,
  COUNT(*) FILTER (WHERE pii_iv NOT LIKE 'v2:%') as still_old_key
FROM public.appointments
WHERE email_encrypted IS NOT NULL;

-- Expected: still_old_key = 0
```

## Phase 4: Update Accessor to Use New Key

```sql
-- Update primary accessor to use v2 key
CREATE OR REPLACE FUNCTION public.get_app_encryption_key()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_value TEXT;
  current_role TEXT;
BEGIN
  current_role := current_setting('role', true);
  
  -- Now retrieve v2 key as primary
  SELECT value INTO key_value
  FROM public.app_config
  WHERE key = 'app.encryption_key_v2'
  LIMIT 1;
  
  -- Fallback to v1 if v2 not found (shouldn't happen after rotation)
  IF key_value IS NULL THEN
    SELECT value INTO key_value
    FROM public.app_config
    WHERE key = 'app.encryption_key'
    LIMIT 1;
    
    -- Log fallback usage
    INSERT INTO public.encryption_key_audit (
      access_type,
      accessed_by_role,
      success,
      key_version,
      error_message
    ) VALUES (
      'read',
      current_role,
      true,
      'v1',
      'WARNING: Using fallback v1 key, v2 not found'
    );
  ELSE
    -- Log successful v2 access
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
      'v2',
      jsonb_build_object('key_length', LENGTH(key_value))
    );
  END IF;
  
  IF key_value IS NULL THEN
    RAISE EXCEPTION 'No encryption key found (v1 or v2)';
  END IF;
  
  RETURN key_value;
END;
$$;

-- Log rotation completion
INSERT INTO public.encryption_key_audit (
  access_type,
  accessed_by_role,
  success,
  key_version,
  metadata
) VALUES (
  'rotation',
  'admin',
  true,
  'v2',
  jsonb_build_object(
    'phase', 'accessor_updated',
    'new_key_active', true
  )
);
```

## Phase 5: Verification Period (7-30 days)

### Daily Verification

```sql
-- Check if any records still using old key
SELECT 
  COUNT(*) FILTER (WHERE pii_iv NOT LIKE 'v2:%') as old_key_records,
  COUNT(*) FILTER (WHERE pii_iv LIKE 'v2:%') as new_key_records
FROM public.appointments
WHERE email_encrypted IS NOT NULL;

-- Monitor dual-key fallback usage
SELECT 
  error_type,
  COUNT(*) as count,
  MAX(error_timestamp) as last_occurrence
FROM public.encryption_errors
WHERE error_type IN ('fallback_key_used', 'decrypt_failed_both_keys')
  AND error_timestamp > NOW() - INTERVAL '24 hours'
GROUP BY error_type;

-- Expected: fallback_key_used = 0 after full re-encryption
```

### Success Criteria (After 30 days)
- ✅ 100% of records encrypted with v2 key
- ✅ Zero fallback key usage logged
- ✅ All decryption successful with v2 key
- ✅ No customer-facing issues reported
- ✅ Performance within SLAs

## Phase 6: Retire Old Key

**⚠️ WARNING:** Only proceed if verification period is successful!

```sql
-- Archive old key before deletion
INSERT INTO public.app_config (key, value, metadata)
SELECT 
  'app.encryption_key_v1_archived',
  value,
  jsonb_build_object(
    'archived_at', NOW(),
    'archived_by', 'admin',
    'original_key', 'app.encryption_key',
    'reason', 'Key rotation completed, archived for audit trail'
  )
FROM public.app_config
WHERE key = 'app.encryption_key';

-- Remove old key from active config
DELETE FROM public.app_config
WHERE key = 'app.encryption_key';

-- Rename v2 to primary
UPDATE public.app_config
SET 
  key = 'app.encryption_key',
  metadata = metadata || jsonb_build_object(
    'promoted_to_primary', NOW(),
    'was_version', 2
  )
WHERE key = 'app.encryption_key_v2';

-- Log retirement
INSERT INTO public.encryption_key_audit (
  access_type,
  accessed_by_role,
  success,
  key_version,
  metadata
) VALUES (
  'rotation',
  'admin',
  true,
  'v2_promoted',
  jsonb_build_object(
    'phase', 'rotation_complete',
    'old_key_retired', true,
    'new_key_promoted', true
  )
);

-- Final verification
SELECT 
  key,
  metadata->>'version' as version,
  metadata->>'promoted_to_primary' as promoted_at
FROM public.app_config
WHERE key LIKE '%encryption_key%'
ORDER BY key;

-- Expected: Only 'app.encryption_key' (promoted v2) and archived v1
```

## Emergency Rollback

If issues occur during rotation:

```sql
-- Rollback Step 1: Revert accessor to v1 key
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
  -- Use v1 key (original)
  SELECT value INTO key_value
  FROM public.app_config
  WHERE key = 'app.encryption_key'
  LIMIT 1;
  
  IF key_value IS NULL THEN
    RAISE EXCEPTION 'Emergency rollback: v1 key not found';
  END IF;
  
  -- Log emergency rollback
  INSERT INTO public.encryption_key_audit (
    access_type,
    accessed_by_role,
    success,
    key_version,
    error_message
  ) VALUES (
    'rotation',
    'admin',
    true,
    'v1',
    'EMERGENCY ROLLBACK: Reverted to v1 key'
  );
  
  RETURN key_value;
END;
$$;

-- Rollback Step 2: Data remains accessible with dual-key decryption
-- No data loss - both v1 and v2 encrypted records still readable

-- Rollback Step 3: Remove problematic v2 key if corrupted
-- DELETE FROM public.app_config WHERE key = 'app.encryption_key_v2';

-- Rollback Step 4: Incident post-mortem
-- Document what went wrong and why rollback was necessary
```

## Key Rotation Schedule

**Recommended Frequency:** Every 12-24 months

**Triggers for Emergency Rotation:**
- 🚨 Key suspected compromised
- 🚨 Security breach affecting key storage
- 🚨 Compliance requirement
- 🚨 Staff turnover (admin who had key access)

## Post-Rotation Checklist

- [ ] All records encrypted with new key (v2)
- [ ] Zero fallback key usage in logs
- [ ] Old key archived securely
- [ ] New key documented in secure location
- [ ] Team briefed on completion
- [ ] Incident response plan updated with new key version
- [ ] Next rotation scheduled (12-24 months)
- [ ] Post-rotation report completed

