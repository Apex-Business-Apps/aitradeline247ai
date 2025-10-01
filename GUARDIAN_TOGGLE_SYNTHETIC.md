# Guardian Phase G-T1: Synthetic Checks Toggle

**Status**: ✅ IMPLEMENTED (Canary Mode)  
**Date**: 2025-10-01  
**Phase**: G-T1 — Enable Synthetic Monitoring

---

## Overview

Synthetic monitoring has been implemented and is ready for canary deployment. The system performs automated health checks against 5 critical targets with distributed locking to prevent overlapping runs.

---

## Implementation Details

### Targets Monitored

| Target ID | URL | Expected | Timeout | Validations |
|-----------|-----|----------|---------|-------------|
| `apex_domain` | https://555a4971-4138-435e-a7ee-dfa3d713d1d3.lovableproject.com | 200 | 5s | SSL valid |
| `health_endpoint` | /healthz | 200 | 3s | JSON: `status` field |
| `readiness_endpoint` | /readyz | 200 | 3s | JSON: `ready` field |
| `static_asset` | /assets/official-logo.svg | 200 | 3s | Content-Type: image/svg+xml |
| `homepage` | / | 200 | 5s | DOM: `#root` element |

### Scheduling Configuration

- **Base Interval**: 6 minutes
- **Jitter**: ±1 minute (5-7 minute effective range)
- **Concurrency**: Single global lock (`synthetic_check_runner`)
- **Lock TTL**: 600 seconds (10 minutes)
- **Worker ID**: UUID per execution

### Database Schema

**Tables Created:**
- `guardian_synthetic_checks` - Check results with validation details
- `guardian_concurrency_locks` - Distributed lock management
- `guardian_config` - Feature flags and configuration

**Functions Created:**
- `acquire_guardian_lock(lock_key, worker_id, ttl)` - Acquire distributed lock
- `release_guardian_lock(lock_key, worker_id)` - Release lock
- `get_guardian_metrics(start_time, end_time)` - Generate metrics report

### Edge Function

**Endpoint**: `guardian-synthetic-check`

**Behavior**:
1. Check if synthetic monitoring is enabled (`guardian_config.synthetic_enabled`)
2. Acquire distributed lock (returns 429 if lock held)
3. Perform all 5 checks in parallel
4. Store results in `guardian_synthetic_checks`
5. **Auto-Disable**: If ANY check fails, disable synthetic monitoring and create high-severity alert
6. Release lock

**Feature Flag**: Default `false` (disabled)

---

## Manual Test Execution

### Run First Check

```bash
curl -X POST \
  https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-synthetic-check \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Enable Synthetic Checks

```sql
UPDATE guardian_config 
SET value = true, updated_at = NOW() 
WHERE key = 'synthetic_enabled';
```

### View Results

```sql
-- Latest check run
SELECT 
  check_run_id,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE success = true) as passed,
  COUNT(*) FILTER (WHERE success = false) as failed,
  MAX(created_at) as run_time
FROM guardian_synthetic_checks
GROUP BY check_run_id
ORDER BY MAX(created_at) DESC
LIMIT 1;

-- Failed checks detail
SELECT 
  target_id,
  target_url,
  status_code,
  response_time_ms,
  error_message,
  validation_results
FROM guardian_synthetic_checks
WHERE success = false
ORDER BY created_at DESC
LIMIT 10;
```

---

## Auto-Disable Logic

**Trigger**: ANY check failure  
**Action**:
1. Set `guardian_config.synthetic_enabled = false`
2. Create `security_alerts` entry with:
   - `alert_type`: `synthetic_check_failure`
   - `severity`: `high`
   - `event_data`: Failed target IDs + run ID

**Recovery**: Manual re-enable required after investigation

---

## Concurrency Protection

**Lock Key**: `synthetic_check_runner`  
**Mechanism**: PostgreSQL-based distributed lock via `guardian_concurrency_locks`

**Lock Lifecycle**:
1. Clean up expired locks (TTL-based)
2. Insert lock row with worker UUID
3. Verify ownership
4. Execute checks
5. Release lock (DELETE)

**Collision Handling**: Returns HTTP 429 if lock already held

---

## Metrics & Observability

### Success Metrics
- Total checks per run: 5
- Expected pass rate: 100%
- Response time thresholds:
  - Health/readiness: <500ms
  - Static assets: <500ms
  - Homepage/apex: <2000ms

### Failure Scenarios
- Network timeout (3-5s per target)
- Unexpected HTTP status
- Missing validation criteria (SSL, JSON fields, DOM elements)
- Content-Type mismatch

### Logs
```
✅ Check apex_domain passed (243ms)
✅ Check health_endpoint passed (89ms)
❌ Check readiness_endpoint failed: Unexpected status 503, expected 200
```

---

## Scheduling Setup (pg_cron)

```sql
-- Enable pg_cron (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule synthetic checks every 6 minutes with jitter handled by function
SELECT cron.schedule(
  'guardian-synthetic-checks',
  '*/6 * * * *', -- Every 6 minutes
  $$
  SELECT net.http_post(
    url := 'https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-synthetic-check',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Note**: Jitter (±1m) is applied by randomizing actual execution within the 6-minute window.

---

## Status Check

### Verify Deployment
```sql
-- Check feature flag
SELECT key, value, updated_at 
FROM guardian_config 
WHERE key = 'synthetic_enabled';

-- Check if lock table exists
SELECT COUNT(*) FROM guardian_concurrency_locks;

-- Check if checks are running
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as checks_count
FROM guardian_synthetic_checks
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', created_at)
ORDER BY minute DESC;
```

### Expected Output (Canary Mode)
- Feature flag: `false` (disabled by default)
- Lock table: Empty or single active lock during execution
- Check frequency: 0 (until enabled)

---

## Canary Activation Checklist

- [x] Database schema deployed
- [x] Edge function deployed
- [x] Distributed lock mechanism verified
- [x] Auto-disable logic implemented
- [x] Alert creation on failure
- [ ] **Manual test run executed** (awaiting)
- [ ] **All checks green** (prerequisite for enable)
- [ ] **Feature flag enabled** (manual step)
- [ ] **pg_cron scheduled** (manual step)

---

## Next Steps

1. **Manual Test**: Run one check manually and verify all targets return green
2. **Enable**: If test passes, update `guardian_config.synthetic_enabled = true`
3. **Schedule**: Create pg_cron job for 6-minute interval
4. **Monitor**: Observe first 1 hour for stability before proceeding to G-T2

---

## Rollback Procedure

```sql
-- Disable synthetic checks
UPDATE guardian_config 
SET value = false, updated_at = NOW() 
WHERE key = 'synthetic_enabled';

-- Remove pg_cron job
SELECT cron.unschedule('guardian-synthetic-checks');

-- Clear active locks
DELETE FROM guardian_concurrency_locks 
WHERE lock_key = 'synthetic_check_runner';
```

---

**Phase G-T1 Complete** — Ready for manual test and canary activation.
