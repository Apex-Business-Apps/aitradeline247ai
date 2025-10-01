# Guardian Implementation Report: Synthetic Checks (G-I5)

**Phase:** G-I5 — Synthetic job (scheduled, non-overlapping, disabled)  
**Status:** ✅ COMPLETE  
**Date:** 2025-10-01

## Summary

Implemented scheduled synthetic monitoring system that checks critical endpoints every 6 minutes with jitter. Uses distributed locking to prevent overlapping runs and disables itself on repeated failures. Default state is **DISABLED** with manual trigger support.

## Changes Made

### 1. Synthetic Check Function

**File:** `supabase/functions/guardian-synthetic-check/index.ts`

Core monitoring function that:
- Checks multiple critical endpoints
- Validates response codes and content
- Uses distributed locking for concurrency control
- Auto-disables on repeated failures
- Stores results in database

### 2. Check Targets

```typescript
const TARGETS: CheckTarget[] = [
  {
    id: 'apex',
    url: 'https://id-preview--555a4971-4138-435e-a7ee-dfa3d713d1d3.lovable.app',
    method: 'GET',
    timeout: 5000,
    expectedStatus: [200]
  },
  {
    id: 'healthz',
    url: 'https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/healthz',
    method: 'GET',
    timeout: 2000,
    expectedStatus: [200],
    validations: {
      checkJsonFields: ['status', 'timestamp']
    }
  },
  {
    id: 'readyz',
    url: 'https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/readyz',
    method: 'GET',
    timeout: 5000,
    expectedStatus: [200, 503],
    validations: {
      checkJsonFields: ['ready', 'checks', 'timestamp']
    }
  },
  {
    id: 'logo',
    url: 'https://id-preview--555a4971-4138-435e-a7ee-dfa3d713d1d3.lovable.app/assets/brand/TRADELEINE_ROBOT_V2.svg',
    method: 'GET',
    timeout: 3000,
    expectedStatus: [200],
    validations: {
      checkContentType: 'image/svg+xml'
    }
  }
];
```

**Coverage:**
- Homepage (apex)
- Health endpoints (healthz, readyz)
- Critical assets (logo)

### 3. Validation System

#### Status Code Validation
```typescript
const statusOk = target.expectedStatus.includes(statusCode);
validationResults.status_code = statusOk;
```

#### Content Type Validation
```typescript
if (target.validations?.checkContentType) {
  const contentType = response.headers.get('content-type') || '';
  validationResults.content_type = contentType.includes(
    target.validations.checkContentType
  );
}
```

#### JSON Field Validation
```typescript
if (target.validations?.checkJsonFields) {
  const json = await response.json();
  for (const field of target.validations.checkJsonFields) {
    validationResults[`json_field_${field}`] = field in json;
  }
}
```

### 4. Concurrency Control

```typescript
// Acquire distributed lock
const lockKey = 'guardian_synthetic_check';
const workerId = crypto.randomUUID();

const { data: lockAcquired, error: lockError } = await supabase
  .rpc('acquire_guardian_lock', {
    p_lock_key: lockKey,
    p_worker_id: workerId,
    p_ttl_seconds: 300 // 5 minutes
  });

if (lockError || !lockAcquired) {
  console.log('🔒 Another synthetic check is already running, skipping');
  return /* skip response */;
}

// ... run checks ...

// Release lock
await supabase.rpc('release_guardian_lock', {
  p_lock_key: lockKey,
  p_worker_id: workerId
});
```

**Mechanism:** Database-backed distributed lock  
**TTL:** 5 minutes (prevents stuck locks)  
**Behavior:** Skip run if lock held by another worker

### 5. Auto-Disable on Failures

```typescript
const { data: results } = await supabase
  .from('guardian_synthetic_checks')
  .select('success')
  .eq('check_run_id', runId);

if (results) {
  failedChecks = results.filter(r => !r.success).length;
}

if (failedChecks >= 2) {
  console.error(`❌ ${failedChecks} checks failed, disabling synthetic checks`);
  
  await supabase.from('guardian_config').upsert({
    key: 'synthetic_checks_enabled',
    value: { 
      enabled: false, 
      disabled_by: 'auto_heal', 
      reason: `${failedChecks}_failures` 
    }
  });

  await supabase.from('security_alerts').insert({
    alert_type: 'synthetic_checks_disabled',
    event_data: { failed_checks: failedChecks, run_id: runId },
    severity: 'high'
  });
}
```

**Threshold:** 2+ failed checks in single run  
**Action:** Disable synthetic checks, create security alert  
**Rationale:** Prevent alert fatigue, signal major incident

## Scheduled Workflow

**File:** `.github/workflows/guardian-synthetic.yml`

### Schedule Configuration
```yaml
on:
  schedule:
    # Every 6 minutes: :00, :06, :12, :18, :24, :30, :36, :42, :48, :54
    - cron: '0,6,12,18,24,30,36,42,48,54 * * * *'
  
  workflow_dispatch:
    # Manual trigger for testing

concurrency:
  group: guardian-synthetic-check
  cancel-in-progress: false
```

**Frequency:** Every 6 minutes  
**Jitter:** 0-60 seconds random delay  
**Concurrency:** Single run at a time (GitHub level)

### Jitter Implementation
```yaml
- name: Add jitter delay
  run: |
    # Random delay 0-60 seconds for jitter
    JITTER=$((RANDOM % 60))
    echo "Adding ${JITTER}s jitter delay..."
    sleep $JITTER
```

**Purpose:** Prevent thundering herd  
**Range:** 0-60 seconds  
**Effect:** Spreads checks across 6-7 minute window

### Execution Steps
```yaml
- name: Run synthetic check
  env:
    SUPABASE_URL: https://hysvqdwmhxnblxfqnszn.supabase.co
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  run: |
    RESPONSE=$(curl -s -w "\n%{http_code}" \
      -X POST \
      -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
      -H "Content-Type: application/json" \
      "${SUPABASE_URL}/functions/v1/guardian-synthetic-check")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -ne 200 ]; then
      echo "❌ Synthetic check failed with status $HTTP_CODE"
      exit 1
    fi
    
    FAILED=$(echo "$BODY" | jq -r '.checks_failed // 0')
    if [ "$FAILED" -gt 0 ]; then
      echo "⚠️ $FAILED checks failed"
      exit 1
    fi
```

**Success:** HTTP 200 with 0 failed checks  
**Failure:** Non-200 status or checks_failed > 0  
**Alerting:** Workflow failure triggers GitHub notifications

## Database Schema

Results stored in `guardian_synthetic_checks`:

```sql
CREATE TABLE guardian_synthetic_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_run_id UUID NOT NULL,
  target_id TEXT NOT NULL,
  target_url TEXT NOT NULL,
  check_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  validation_results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Response Format

### Successful Run
```json
{
  "status": "completed",
  "run_id": "f7c3d8e9-1234-5678-9abc-def012345678",
  "checks_run": 4,
  "checks_failed": 0,
  "duration_ms": 2345,
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Disabled State
```json
{
  "status": "disabled",
  "message": "Synthetic checks are currently disabled",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Concurrent Run Skipped
```json
{
  "status": "skipped",
  "reason": "concurrent_run_in_progress",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

## Configuration

Enable/disable via `guardian_config` table:

```sql
-- Enable synthetic checks
INSERT INTO guardian_config (key, value) VALUES
  ('synthetic_checks_enabled', '{"enabled": true}')
ON CONFLICT (key) DO UPDATE SET value = '{"enabled": true}'::jsonb;

-- Disable synthetic checks
UPDATE guardian_config 
SET value = '{"enabled": false, "disabled_by": "manual"}'::jsonb 
WHERE key = 'synthetic_checks_enabled';
```

## Testing

### Manual Trigger (GitHub)
1. Go to Actions → Guardian Synthetic Checks
2. Click "Run workflow"
3. Select branch
4. Click "Run workflow"

### Direct Invocation
```bash
curl -X POST \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-synthetic-check
```

### Query Results
```sql
SELECT 
  check_run_id,
  target_id,
  success,
  status_code,
  response_time_ms,
  created_at
FROM guardian_synthetic_checks
WHERE check_run_id = 'YOUR_RUN_ID'
ORDER BY created_at;
```

## Monitoring

### Recent Failures
```sql
SELECT 
  target_id,
  COUNT(*) as failure_count,
  MAX(created_at) as last_failure
FROM guardian_synthetic_checks
WHERE success = false
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY target_id
ORDER BY failure_count DESC;
```

### Check Frequency
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(DISTINCT check_run_id) as runs
FROM guardian_synthetic_checks
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

### Success Rate
```sql
SELECT 
  target_id,
  COUNT(*) as total_checks,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_pct
FROM guardian_synthetic_checks
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY target_id
ORDER BY success_rate_pct;
```

## Activation Plan

Synthetic checks are **DISABLED by default**. To enable:

1. **Verify endpoints:** Ensure all targets are reachable
2. **Test manually:** Run workflow_dispatch several times
3. **Review results:** Check database for expected behavior
4. **Enable config:**
   ```sql
   UPDATE guardian_config 
   SET value = '{"enabled": true}'::jsonb 
   WHERE key = 'synthetic_checks_enabled';
   ```
5. **Monitor:** Watch for false positives in first 24h
6. **Tune thresholds:** Adjust timeouts if needed

## Next Phase

Ready for **G-I6**: Standardized logging with PII/key redaction.
