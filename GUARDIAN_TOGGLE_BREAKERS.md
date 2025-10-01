# Guardian Phase G-T2: Circuit Breakers (Observe-Only)

**Status**: ✅ IMPLEMENTED (Observe-Only Mode)  
**Date**: 2025-10-01  
**Phase**: G-T2 — Enable Circuit Breaker Monitoring

---

## Overview

Circuit breakers are now active in **observe-only mode**. They log state transitions and failure patterns without actually tripping or blocking requests. This allows us to observe breaker behavior patterns before enabling active circuit breaking.

---

## Implementation Details

### Monitored Services

| Service | Failure Threshold | Success Threshold | Cooldown Period |
|---------|------------------|-------------------|-----------------|
| `supabase` | 5 failures in 60s | 3 successes | 30s |
| `twilio` | 3 failures in 30s | 2 successes | 60s |
| `resend` | 3 failures in 30s | 2 successes | 60s |
| `openai` | 5 failures in 60s | 3 successes | 30s |

### Circuit Breaker States

**Closed** (Normal Operation)
- All requests pass through
- Failures increment failure counter
- After threshold: Would transition to Open (but observe-only logs instead)

**Open** (Tripped — Not Active Yet)
- Would fail fast without attempting request
- Cooldown period before transitioning to Half-Open
- **Current Behavior**: Log state but allow requests

**Half-Open** (Recovery Testing)
- Would allow limited probe requests
- Success → Closed, Failure → Open
- **Current Behavior**: Log probe results

### Database Schema

**Table**: `guardian_circuit_breaker_events`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `service_name` | TEXT | Service identifier |
| `state` | TEXT | `closed`, `open`, `half_open` |
| `previous_state` | TEXT | State before transition |
| `failure_count` | INTEGER | Consecutive failures |
| `success_count` | INTEGER | Consecutive successes |
| `reason` | TEXT | State change reason |
| `metadata` | JSONB | **Secrets redacted** |
| `created_at` | TIMESTAMPTZ | Event timestamp |

---

## Logging & Secret Redaction

### Log Format

```
[2025-10-01T05:57:30Z] Circuit Breaker Observation - Service: twilio, State: closed, Failures: 0, Successes: 15
[2025-10-01T05:58:45Z] Circuit Breaker Observation - Service: supabase, State: closed, Failures: 2, Successes: 8
```

### Redacted Fields

**Secrets Excluded from Logs**:
- API keys (Twilio Auth Token, Resend API Key, etc.)
- User tokens
- Session identifiers
- Phone numbers (use hashed ANI instead)
- Email addresses (use hashed identifiers)

**Metadata Structure**:
```json
{
  "timestamp": "2025-10-01T05:57:30Z",
  "mode": "observe_only",
  "service_endpoint": "api.twilio.com",
  "error_type": "timeout",
  "error_code": "ETIMEDOUT"
}
```

**Prohibited in Metadata**:
- `auth_token`, `api_key`, `secret`
- `password`, `bearer_token`
- `user_id` (unless hashed)
- Any PII (names, addresses, etc.)

---

## Edge Function

**Endpoint**: `guardian-health-monitor`

**Behavior**:
1. Read `guardian_config.circuit_breaker_mode` (default: `observe_only`)
2. For each monitored service:
   - Read current breaker state from memory map
   - Log state observation with timestamp
   - Store event in `guardian_circuit_breaker_events` with redacted metadata
3. **No Request Blocking**: All requests pass through regardless of state

**Feature Flag**: `circuit_breaker_mode = 'observe_only'`

---

## Monitoring & Queries

### View Recent Breaker Events

```sql
SELECT 
  service_name,
  state,
  previous_state,
  failure_count,
  success_count,
  reason,
  created_at
FROM guardian_circuit_breaker_events
ORDER BY created_at DESC
LIMIT 50;
```

### Detect State Transitions

```sql
-- Services with state changes in last hour
SELECT 
  service_name,
  COUNT(*) FILTER (WHERE state != previous_state) as transitions,
  MAX(created_at) as last_transition
FROM guardian_circuit_breaker_events
WHERE created_at > NOW() - INTERVAL '1 hour'
AND previous_state IS NOT NULL
GROUP BY service_name
HAVING COUNT(*) FILTER (WHERE state != previous_state) > 0;
```

### Failure Pattern Analysis

```sql
-- Services approaching failure threshold
SELECT 
  service_name,
  failure_count,
  state,
  created_at
FROM guardian_circuit_breaker_events
WHERE failure_count >= 3
AND created_at > NOW() - INTERVAL '6 hours'
ORDER BY failure_count DESC, created_at DESC;
```

### Secret Redaction Audit

```sql
-- Verify no secrets in metadata
SELECT 
  id,
  service_name,
  metadata,
  created_at
FROM guardian_circuit_breaker_events
WHERE 
  metadata::text ~* '(api_key|auth_token|password|secret|bearer)'
ORDER BY created_at DESC
LIMIT 10;

-- Should return 0 rows if redaction is working
```

---

## Observe-Only Mode Configuration

### Current Settings

```sql
SELECT key, value, updated_at 
FROM guardian_config 
WHERE key = 'circuit_breaker_mode';

-- Expected: {"observe_only": true} or "observe_only"
```

### Enable Active Mode (Future)

```sql
-- DO NOT RUN YET - Phase G-T3 only
UPDATE guardian_config 
SET value = '"active"', updated_at = NOW() 
WHERE key = 'circuit_breaker_mode';
```

---

## Scheduled Monitoring

Circuit breaker observations are triggered by the `guardian-health-monitor` function, which runs:

**Frequency**: Every 5 minutes (via pg_cron or scheduled edge function)

**Setup**:
```sql
SELECT cron.schedule(
  'guardian-health-monitor',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-health-monitor',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

---

## Validation Checklist

### Secret Redaction Verification

- [x] API keys excluded from logs
- [x] User tokens excluded from metadata
- [x] PII (emails, phones) hashed or excluded
- [x] Error messages sanitized (no credentials)
- [ ] **Manual audit**: Query `guardian_circuit_breaker_events` for sensitive data

### Log Structure Verification

- [x] Timestamp included (ISO 8601 format)
- [x] Service name present
- [x] State (closed/open/half_open) logged
- [x] Failure/success counts recorded
- [x] Reason field populated
- [ ] **Manual check**: Review recent logs for completeness

### Observe-Only Confirmation

- [x] No request blocking implemented
- [x] All requests pass through regardless of state
- [x] State transitions logged only
- [ ] **Manual test**: Trigger failure scenario and verify requests still succeed

---

## Test Scenarios

### Scenario 1: Normal Operation
**Setup**: All services healthy  
**Expected Logs**:
```
[timestamp] Circuit Breaker Observation - Service: supabase, State: closed, Failures: 0, Successes: 20
[timestamp] Circuit Breaker Observation - Service: twilio, State: closed, Failures: 0, Successes: 15
```

### Scenario 2: Approaching Threshold
**Setup**: Twilio has 2 failures (threshold: 3)  
**Expected Logs**:
```
[timestamp] Circuit Breaker Observation - Service: twilio, State: closed, Failures: 2, Successes: 5
⚠️ Service approaching failure threshold (2/3)
```

### Scenario 3: Would Trip (Observe-Only)
**Setup**: Supabase has 5 failures (threshold: 5)  
**Expected Logs**:
```
[timestamp] Circuit Breaker Observation - Service: supabase, State: closed, Failures: 5, Successes: 0
⚠️ Would transition to Open (observe-only mode, not tripping)
```
**Database Event**:
```sql
-- Would create state transition event
INSERT INTO guardian_circuit_breaker_events (
  service_name, state, previous_state, failure_count, reason
) VALUES (
  'supabase', 'closed', 'closed', 5, 'observe_only_threshold_reached'
);
```

---

## Alerting (Observe-Only Notifications)

**No Alerts Yet** — Phase G-T2 focuses on data collection.

**Future Alert Triggers** (Phase G-T3+):
- State transition to Open (first time)
- Repeated Open → Half-Open → Open cycles (flapping)
- Sustained Open state >10 minutes

---

## Next Steps

1. **Monitor**: Observe circuit breaker events for 24 hours
2. **Analyze**: Review failure patterns and state transitions
3. **Validate**: Confirm secret redaction is working
4. **Report**: Include breaker observations in G-T4 canary report
5. **Prepare**: Plan active mode transition (requires G-T3 auto-heal)

---

## Rollback Procedure

```sql
-- Disable circuit breaker monitoring (keep logs)
UPDATE guardian_config 
SET value = '"disabled"', updated_at = NOW() 
WHERE key = 'circuit_breaker_mode';

-- Remove pg_cron job
SELECT cron.unschedule('guardian-health-monitor');
```

---

**Phase G-T2 Complete** — Circuit breakers in observe-only mode, logging without blocking.
