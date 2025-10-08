# Production Encryption Rollout Plan

## Pre-Rollout Checklist

### Infrastructure
- [ ] All staging tests completed successfully
- [ ] Encryption key configured in production `app_config`
- [ ] Database backup completed (full backup before rollout)
- [ ] Rollback plan tested and ready
- [ ] Monitoring dashboards configured
- [ ] Alerting rules set up

### Team Readiness
- [ ] DevOps team briefed on rollout
- [ ] Support team trained on error handling
- [ ] On-call rotation established
- [ ] Communication plan for stakeholders
- [ ] Incident response procedures reviewed

### Validation
- [ ] Run health check: `SELECT * FROM get_encryption_health_summary();`
- [ ] Verify trigger is DISABLED before starting
- [ ] Confirm total row count: `SELECT COUNT(*) FROM appointments;`
- [ ] Identify VIP/critical records for priority encryption

## Rollout Phases

### Phase 1: Initial Batch (0-5% of data)

**Timeline:** Day 1, Hours 1-2

```sql
-- Step 1: Encrypt first 500 rows (or 5% of total, whichever is smaller)
SELECT public.batch_encrypt_appointments(500);

-- Step 2: Verify encryption
SELECT * FROM public.get_encryption_health_summary();

-- Step 3: Spot check 10 random records
SELECT 
  id,
  email,
  public.decrypt_pii_with_iv_logged(email_encrypted, pii_iv, id) as decrypted,
  email = public.decrypt_pii_with_iv_logged(email_encrypted, pii_iv, id) as matches
FROM public.appointments
WHERE email_encrypted IS NOT NULL
ORDER BY RANDOM()
LIMIT 10;

-- Step 4: Check for errors
SELECT * FROM public.encryption_errors 
WHERE error_timestamp > NOW() - INTERVAL '1 hour';
```

**Go/No-Go Criteria:**
- ✅ All 500 rows encrypted successfully
- ✅ Decryption matches plaintext
- ✅ Zero critical errors
- ✅ Performance within acceptable range
- ❌ If any failures, STOP and investigate

**Wait Time:** 30 minutes monitoring

### Phase 2: Expanded Batch (5-25% of data)

**Timeline:** Day 1, Hours 3-6

```sql
-- Encrypt next 2000 rows (or up to 25% total)
SELECT public.batch_encrypt_appointments(2000);

-- Full health check
SELECT * FROM public.get_encryption_health_summary();

-- Monitor key access patterns
SELECT * FROM public.get_key_access_stats('2 hours'::interval);

-- Check error rates
SELECT 
  error_type,
  COUNT(*) as count,
  MAX(error_timestamp) as last_occurrence
FROM public.encryption_errors
WHERE error_timestamp > NOW() - INTERVAL '3 hours'
GROUP BY error_type;
```

**Go/No-Go Criteria:**
- ✅ Encryption percentage 20-25%
- ✅ Error rate < 0.1% (< 2 errors)
- ✅ System performance normal
- ✅ No customer-facing issues reported
- ❌ If errors spike, STOP and assess

**Wait Time:** 2 hours monitoring

### Phase 3: Bulk Migration (25-90% of data)

**Timeline:** Day 1-2, Incremental batches

**Strategy:** Encrypt in batches of 5,000 rows during low-traffic periods

```sql
-- Run batch encryption multiple times
-- Recommended: Run every 30 minutes during off-peak hours
DO $$
DECLARE
  batch_count INTEGER := 0;
  target_percentage NUMERIC := 90;
  current_percentage NUMERIC;
BEGIN
  LOOP
    -- Encrypt batch
    PERFORM public.batch_encrypt_appointments(5000);
    batch_count := batch_count + 1;
    
    -- Check progress
    SELECT encryption_percentage INTO current_percentage 
    FROM public.get_encryption_health_summary();
    
    -- Log progress
    RAISE NOTICE 'Batch %: %% encrypted', batch_count, current_percentage;
    
    -- Exit when target reached
    EXIT WHEN current_percentage >= target_percentage;
    
    -- Pause between batches (10 seconds)
    PERFORM pg_sleep(10);
  END LOOP;
END $$;

-- Final health check
SELECT * FROM public.get_encryption_health_summary();
```

**Monitoring During Bulk Migration:**

Every 30 minutes, check:
1. Encryption progress: `SELECT * FROM get_encryption_health_summary();`
2. Error rate: `SELECT COUNT(*) FROM encryption_errors WHERE error_timestamp > NOW() - INTERVAL '30 minutes';`
3. System CPU/Memory usage
4. Database connection pool
5. API response times

**Abort Conditions:**
- ❌ Error rate exceeds 1% (more than 50 errors per 5000 rows)
- ❌ System CPU consistently >80%
- ❌ Database locks detected
- ❌ Customer-facing service degradation
- ❌ Decryption failures detected

**Wait Time:** Continuous monitoring throughout migration

### Phase 4: Enable Trigger for New Records

**Timeline:** Day 2, After 90% encryption complete

```sql
-- Step 1: Verify current state
SELECT * FROM public.get_encryption_health_summary();

-- Expected: encryption_percentage >= 90%

-- Step 2: Enable the trigger
ALTER TABLE public.appointments 
ENABLE TRIGGER encrypt_appointment_pii;

-- Step 3: Test with a canary insert
INSERT INTO public.appointments (
  organization_id,
  start_at,
  end_at,
  email,
  e164,
  first_name,
  status,
  note
) VALUES (
  'test-org-id'::uuid,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
  'canary@example.com',
  '+15551234567',
  'CanaryTest',
  'pending',
  'Trigger activation test'
) RETURNING 
  id, 
  email_encrypted IS NOT NULL as encrypted,
  pii_iv IS NOT NULL as has_iv;

-- Expected: encrypted = true, has_iv = true

-- Step 4: Monitor new inserts for 1 hour
SELECT 
  COUNT(*) as new_records,
  COUNT(*) FILTER (WHERE email_encrypted IS NOT NULL) as auto_encrypted,
  COUNT(*) FILTER (WHERE pii_iv IS NULL AND email_encrypted IS NOT NULL) as missing_iv
FROM public.appointments
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Expected: new_records = auto_encrypted, missing_iv = 0
```

**Go/No-Go Criteria:**
- ✅ Trigger test successful
- ✅ All new inserts auto-encrypted
- ✅ No IV mismatches
- ✅ No performance degradation on writes
- ❌ If trigger fails, DISABLE immediately

**Wait Time:** 4 hours monitoring

### Phase 5: Complete Remaining Records

**Timeline:** Day 2-3

```sql
-- Encrypt remaining 10%
SELECT public.batch_encrypt_appointments(NULL); -- NULL = encrypt all remaining

-- Final verification
SELECT * FROM public.get_encryption_health_summary();

-- Expected: encryption_percentage = 100%, unencrypted_appointments = 0

-- Comprehensive audit
SELECT 
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE email_encrypted IS NOT NULL) as encrypted_count,
  COUNT(*) FILTER (WHERE pii_iv IS NULL) as missing_iv_count,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND email_encrypted IS NULL) as unencrypted_count
FROM public.appointments;

-- Expected: encrypted_count = total_appointments, missing_iv_count = 0, unencrypted_count = 0
```

**Final Checklist:**
- ✅ 100% encryption coverage achieved
- ✅ Zero missing IVs
- ✅ Trigger enabled and working
- ✅ All monitoring green
- ✅ No customer complaints
- ✅ Performance within SLAs

## Post-Rollout Monitoring (Days 3-30)

### Daily Checks (Week 1)
```sql
-- Run daily health check
SELECT * FROM public.get_encryption_health_summary();

-- Check daily error rate
SELECT 
  DATE(error_timestamp) as error_date,
  error_type,
  COUNT(*) as error_count
FROM public.encryption_errors
WHERE error_timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(error_timestamp), error_type
ORDER BY error_date DESC;

-- Monitor key access patterns
SELECT * FROM public.get_key_access_stats('24 hours'::interval);
```

### Weekly Checks (Weeks 2-4)
```sql
-- Weekly encryption health report
SELECT * FROM public.get_encryption_health_summary();

-- Weekly error summary
SELECT 
  error_type,
  COUNT(*) as total_errors,
  MIN(error_timestamp) as first_occurrence,
  MAX(error_timestamp) as last_occurrence
FROM public.encryption_errors
WHERE error_timestamp > NOW() - INTERVAL '7 days'
GROUP BY error_type;
```

### Alert Thresholds

Set up automated alerts for:
- ❗ Encryption percentage drops below 99%
- ❗ More than 10 encryption errors per hour
- ❗ Decryption failures detected
- ❗ Missing IVs appear (critical)
- ❗ Trigger failures
- ❗ Key access failures

## Rollback Procedure

If critical issues occur at any phase:

### Immediate Actions (< 5 minutes)
```sql
-- 1. Disable trigger immediately
ALTER TABLE public.appointments 
DISABLE TRIGGER encrypt_appointment_pii;

-- 2. Stop any running batch operations (cancel query)

-- 3. Verify plaintext columns still accessible
SELECT COUNT(*) FROM public.appointments WHERE email IS NOT NULL;

-- Expected: All records still have plaintext (we never delete it)
```

### Assessment (5-30 minutes)
1. Review error logs: `SELECT * FROM encryption_errors WHERE error_timestamp > NOW() - INTERVAL '1 hour';`
2. Check system metrics (CPU, memory, connections)
3. Identify root cause
4. Determine if rollback or forward-fix is appropriate

### Full Rollback (if needed)
```sql
-- Option 1: Keep encrypted data, but disable trigger
-- (Recommended for minor issues - allows forward fix)
ALTER TABLE public.appointments 
DISABLE TRIGGER encrypt_appointment_pii;

-- Option 2: Clear encrypted columns (if corruption detected)
-- WARNING: Only use if decryption is completely broken
-- UPDATE public.appointments 
-- SET email_encrypted = NULL, 
--     e164_encrypted = NULL, 
--     first_name_encrypted = NULL,
--     pii_iv = NULL;

-- Option 3: Restore from backup (nuclear option)
-- Follow standard database restore procedures
-- Contact DBA team immediately
```

## Success Metrics

After 30 days:
- ✅ 100% encryption coverage maintained
- ✅ < 0.01% error rate
- ✅ Zero data loss incidents
- ✅ Zero customer-facing issues
- ✅ Performance within SLAs
- ✅ Audit compliance achieved

## Communication Plan

### Stakeholders to Notify
- Executive team (before/after)
- Security team (daily updates)
- Support team (real-time issues)
- Customers (if any issues occur)

### Status Update Schedule
- **Phase 1-2:** Hourly updates to #encryption-rollout Slack channel
- **Phase 3:** Updates every 4 hours
- **Phase 4-5:** Daily updates
- **Post-rollout:** Weekly reports for first month

## Lessons Learned / Post-Mortem

After rollout completion, document:
1. What went well
2. What could be improved
3. Unexpected issues encountered
4. Performance metrics vs. expectations
5. Recommendations for future migrations
