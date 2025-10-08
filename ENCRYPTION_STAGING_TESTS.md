# Encryption Staging Test Procedures

## Pre-Test Checklist

- [ ] Encryption key is configured in `app_config` table
- [ ] All encryption functions are deployed
- [ ] `get_app_encryption_key()` accessor is working
- [ ] Trigger is DISABLED for testing
- [ ] Test database has sample data (10-100 appointments)

## Test Suite

### 1. Key Access Tests

```sql
-- Test 1: Verify key accessor works (service_role only)
-- Run as service_role
SELECT LENGTH(public.get_app_encryption_key()) > 0 as key_accessible;

-- Expected: Returns true
-- Expected: Creates audit log entry
SELECT * FROM public.encryption_key_audit ORDER BY access_timestamp DESC LIMIT 1;
```

### 2. Encryption Function Tests

```sql
-- Test 2: Encrypt sample data
SELECT 
  id,
  email,
  e164,
  first_name
FROM public.appointments 
WHERE pii_iv IS NULL 
LIMIT 5;

-- Run batch encryption on 5 rows
SELECT public.batch_encrypt_appointments(5);

-- Verify: Check encrypted columns are populated
SELECT 
  id,
  email IS NOT NULL as has_plaintext,
  email_encrypted IS NOT NULL as has_encrypted,
  pii_iv IS NOT NULL as has_iv
FROM public.appointments 
WHERE email_encrypted IS NOT NULL 
LIMIT 5;

-- Expected: All three should be true
```

### 3. Decryption Tests

```sql
-- Test 3: Verify decryption works (use logged version)
SELECT 
  id,
  email as original_plaintext,
  public.decrypt_pii_with_iv_logged(email_encrypted, pii_iv, id) as decrypted_email
FROM public.appointments
WHERE email_encrypted IS NOT NULL
LIMIT 5;

-- Expected: original_plaintext = decrypted_email (when crypto is implemented)
-- Check for decryption errors
SELECT * FROM public.encryption_errors 
WHERE error_timestamp > NOW() - INTERVAL '5 minutes';
```

### 4. Health Check Tests

```sql
-- Test 4: Run health check
SELECT * FROM public.get_encryption_health_summary();

-- Expected output:
-- - total_appointments: (count of all rows)
-- - encrypted_appointments: (count of rows with encrypted data)
-- - encryption_percentage: (0-100%)
-- - missing_iv_count: 0 (should be zero!)
-- - health_status: One of HEALTHY/GOOD/WARNING/CRITICAL
```

### 5. Batch Encryption Stress Test

```sql
-- Test 5: Batch encrypt larger dataset
-- Start with 10 rows
SELECT public.batch_encrypt_appointments(10);
SELECT * FROM public.get_encryption_health_summary();

-- Then 50 rows
SELECT public.batch_encrypt_appointments(50);
SELECT * FROM public.get_encryption_health_summary();

-- Then 100 rows
SELECT public.batch_encrypt_appointments(100);
SELECT * FROM public.get_encryption_health_summary();

-- Monitor performance and error logs after each batch
SELECT 
  error_type,
  COUNT(*) as error_count
FROM public.encryption_errors
WHERE error_timestamp > NOW() - INTERVAL '10 minutes'
GROUP BY error_type;
```

### 6. Trigger Tests (Enable for Testing Only)

```sql
-- Test 6: Enable trigger temporarily
ALTER TABLE public.appointments 
ENABLE TRIGGER encrypt_appointment_pii;

-- Insert new test row
INSERT INTO public.appointments (
  organization_id,
  start_at,
  end_at,
  email,
  e164,
  first_name,
  status
) VALUES (
  'test-org-id'::uuid,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
  'test@example.com',
  '+15551234567',
  'TestUser',
  'pending'
) RETURNING id, email, email_encrypted IS NOT NULL as was_encrypted, pii_iv IS NOT NULL as has_iv;

-- Expected: was_encrypted = true, has_iv = true

-- DISABLE trigger after test
ALTER TABLE public.appointments 
DISABLE TRIGGER encrypt_appointment_pii;
```

### 7. Error Handling Tests

```sql
-- Test 7: Test missing IV handling
UPDATE public.appointments 
SET pii_iv = NULL 
WHERE id = 'some-test-id'::uuid;

-- Try to decrypt (should log error gracefully)
SELECT public.decrypt_pii_with_iv_logged(email_encrypted, pii_iv, id)
FROM public.appointments
WHERE id = 'some-test-id'::uuid;

-- Check error log
SELECT * FROM public.encryption_errors 
WHERE error_type = 'missing_iv' 
ORDER BY error_timestamp DESC LIMIT 1;

-- Expected: Returns NULL, logs error, doesn't crash
```

### 8. Key Access Audit Tests

```sql
-- Test 8: Review key access patterns
SELECT * FROM public.get_key_access_stats('1 hour'::interval);

-- Expected output:
-- - total_accesses: (should be > 0 from previous tests)
-- - successful_accesses: (should match total if no errors)
-- - failed_accesses: 0 (unless intentional error tests)
-- - unique_access_types: ['read']
-- - last_access_time: (recent timestamp)
```

### 9. Rollback Test

```sql
-- Test 9: Disable trigger and verify no auto-encryption
ALTER TABLE public.appointments 
DISABLE TRIGGER encrypt_appointment_pii;

-- Insert row without encryption
INSERT INTO public.appointments (
  organization_id,
  start_at,
  end_at,
  email,
  e164,
  first_name,
  status
) VALUES (
  'test-org-id'::uuid,
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days' + INTERVAL '1 hour',
  'rollback-test@example.com',
  '+15559876543',
  'RollbackTest',
  'pending'
) RETURNING id, email, email_encrypted IS NULL as not_encrypted;

-- Expected: not_encrypted = true (plaintext still works)
```

## Success Criteria

✅ All tests pass without exceptions
✅ Decrypted values match original plaintext (when crypto implemented)
✅ No orphaned IVs (encrypted data without IV)
✅ Health check reports accurate statistics
✅ Audit logs capture all key accesses
✅ Error logs capture failures without crashing
✅ Performance is acceptable (< 100ms per row encryption)
✅ Rollback works (disable trigger, plaintext still accessible)

## Performance Benchmarks

| Batch Size | Expected Time | Acceptable Range |
|-----------|---------------|------------------|
| 10 rows   | < 1 second    | 0.5-2 seconds   |
| 50 rows   | < 5 seconds   | 2-10 seconds    |
| 100 rows  | < 10 seconds  | 5-20 seconds    |
| 500 rows  | < 50 seconds  | 20-120 seconds  |

## Failure Response

If any test fails:
1. **DO NOT** proceed to production
2. Review error logs in `encryption_errors` table
3. Check audit trail in `encryption_key_audit` table
4. Verify key is properly configured
5. Fix issues and re-run full test suite
6. Document any issues in incident log

## Next Steps After Successful Testing

1. Review all test results with team
2. Document any performance concerns
3. Plan production rollout schedule
4. Prepare monitoring dashboards
5. Brief support team on error handling
6. Schedule production deployment window
