# Guardian Phase G-T3: Auto-Heal Active Mode

**Status**: ✅ IMPLEMENTED (Guardrails Active)  
**Date**: 2025-10-01  
**Phase**: G-T3 — Enable Auto-Healing with Safeguards

---

## Overview

Auto-healing is now available in **ACTIVE mode** with strict guardrails:
- **Rate Limit**: Maximum 1 controlled restart per action type per 60 minutes
- **Kill-Switch**: Environment variable to instantly revert to DRY-RUN
- **Fallback**: If platform cannot perform action, remain in log-only mode

---

## Auto-Heal Actions

### Supported Actions

| Action Type | Trigger Condition | Rate Limit | Fallback Behavior |
|-------------|------------------|------------|-------------------|
| `worker_restart` | /healthz fails 3+ times in 15m | 1/hour | Log inability to restart |
| `disable_integration` | External API fails 5+ times in 5m | 1/hour per integration | Disable edge function calls |
| `connection_pool_scale` | DB connection errors 10+ in 10m | 1/hour | Log, no scaling |
| `observe_only` | Monitoring-only action | Unlimited | N/A |

### Guardrails

**1. Rate Limiting**
- Database function: `is_autoheal_allowed(action_type)` 
- Checks: Actions of same type in last 60 minutes
- Limit: 0 recent actions (exactly 1 per hour)

**2. Kill-Switch**
- Environment variable: `GUARDIAN_AUTOHEAL_KILLSWITCH=true`
- Effect: Forces DRY-RUN mode regardless of `guardian_config.autoheal_mode`
- Activation: Instant (no restart required)

**3. Fallback to Log-Only**
- If platform cannot perform action (e.g., no restart capability), log the attempt but don't error
- Status: `failed` with metadata indicating platform limitation

---

## Database Schema

**Table**: `guardian_autoheal_actions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `action_type` | TEXT | Action performed |
| `trigger_reason` | TEXT | Why action was triggered |
| `status` | TEXT | `initiated`, `success`, `failed`, `skipped` |
| `mode` | TEXT | `dry_run` or `active` |
| `metadata` | JSONB | Action details (secrets redacted) |
| `created_at` | TIMESTAMPTZ | Action timestamp |

**Function**: `is_autoheal_allowed(action_type)`

Returns `BOOLEAN` indicating if rate limit allows action.

---

## Edge Function: guardian-health-monitor

### Behavior in Active Mode

```typescript
// Check configuration
const autoHealMode = getConfig('autoheal_mode'); // 'dry_run' or 'active'
const killSwitch = Deno.env.get('GUARDIAN_AUTOHEAL_KILLSWITCH');
const effectiveMode = killSwitch === 'true' ? 'dry_run' : autoHealMode;

// Example: Multiple synthetic check failures
if (recentFailures >= 3) {
  await performAutoHeal(
    'multiple_synthetic_check_failures',
    'observe_only', // or 'worker_restart'
    supabase,
    effectiveMode // Uses kill-switch override
  );
}
```

### Auto-Heal Flow

1. **Check Rate Limit**: `is_autoheal_allowed(action_type)`
   - If exceeded → Status: `skipped`, Reason: `rate_limit_exceeded`
   - If allowed → Proceed

2. **Check Mode**:
   - `dry_run` → Log action, Status: `skipped`, Metadata: `{simulated: true}`
   - `active` → Perform action

3. **Execute Action**:
   - Status: `initiated` (before execution)
   - **Perform** (e.g., restart worker, disable integration)
   - Status: `success` or `failed` (after execution)

4. **Create Alert** (if active mode + success):
   - `alert_type`: `autoheal_action_taken`
   - `severity`: `medium`
   - `event_data`: Action type, trigger reason

5. **Fallback on Failure**:
   - Status: `failed`
   - Metadata: `{error: "Platform cannot restart", failed_at: "..."}`
   - Log error, do not retry

---

## Configuration

### Enable Active Mode

```sql
-- Switch from DRY-RUN to ACTIVE
UPDATE guardian_config 
SET value = '"active"', updated_at = NOW() 
WHERE key = 'autoheal_mode';
```

### Verify Current Mode

```sql
SELECT key, value, updated_at 
FROM guardian_config 
WHERE key = 'autoheal_mode';

-- Expected: "active" or "dry_run"
```

### Kill-Switch Activation

**Environment Variable**:
```bash
# In Supabase Edge Function secrets
GUARDIAN_AUTOHEAL_KILLSWITCH=true
```

**Effect**: Overrides `autoheal_mode` to `dry_run` immediately.

**Verification**:
```bash
# Check edge function logs
curl -X POST \
  https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-health-monitor \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Response should include:
# { "autoheal_mode": "dry_run", "kill_switch_active": true }
```

---

## Monitoring & Queries

### View Recent Auto-Heal Actions

```sql
SELECT 
  action_type,
  trigger_reason,
  status,
  mode,
  metadata,
  created_at
FROM guardian_autoheal_actions
ORDER BY created_at DESC
LIMIT 20;
```

### Active Mode Actions (Last 24h)

```sql
SELECT 
  action_type,
  COUNT(*) as action_count,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'skipped') as skipped
FROM guardian_autoheal_actions
WHERE mode = 'active'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY action_type;
```

### Rate Limit Violations

```sql
-- Actions skipped due to rate limiting
SELECT 
  action_type,
  COUNT(*) as skip_count,
  MAX(created_at) as last_skipped
FROM guardian_autoheal_actions
WHERE status = 'skipped'
AND metadata->>'skip_reason' = 'rate_limit_exceeded'
AND created_at > NOW() - INTERVAL '6 hours'
GROUP BY action_type
ORDER BY skip_count DESC;
```

### Detect Runaway Healing

```sql
-- More than 5 active heals in 24h = runaway
SELECT COUNT(*) as active_heal_count
FROM guardian_autoheal_actions
WHERE mode = 'active'
AND status IN ('success', 'initiated')
AND created_at > NOW() - INTERVAL '24 hours';

-- If count > 5, auto-disable triggered in Phase G-T4
```

---

## Guardrail Validation

### Rate Limit Test

**Scenario**: Trigger 2 consecutive `worker_restart` actions within 1 hour

**Expected Behavior**:
1. First action: Status = `success` or `failed` (executed)
2. Second action: Status = `skipped`, Reason = `rate_limit_exceeded`

**SQL Verification**:
```sql
SELECT 
  action_type,
  status,
  metadata->>'skip_reason' as skip_reason,
  created_at
FROM guardian_autoheal_actions
WHERE action_type = 'worker_restart'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at;
```

### Kill-Switch Test

**Steps**:
1. Set `GUARDIAN_AUTOHEAL_KILLSWITCH=true` in edge function secrets
2. Trigger auto-heal condition
3. Verify action status = `skipped`, mode = `dry_run`

**Expected Logs**:
```
[DRY-RUN] Would perform auto-heal: worker_restart - Reason: healthz_failures
Kill-switch active: reverting to dry-run mode
```

### Fallback Test

**Scenario**: Trigger action on platform without restart capability

**Expected Behavior**:
- Status: `failed`
- Metadata: `{error: "Platform does not support worker restart", failed_at: "..."}`
- No exception thrown
- Logged for manual review

---

## Alerting

### Alert Creation (Active Mode Only)

**Trigger**: Successful auto-heal action in active mode

**Alert Details**:
```sql
INSERT INTO security_alerts (
  alert_type,
  severity,
  event_data
) VALUES (
  'autoheal_action_taken',
  'medium',
  jsonb_build_object(
    'action_type', 'worker_restart',
    'trigger_reason', 'multiple_synthetic_check_failures',
    'mode', 'active'
  )
);
```

### Alert Query

```sql
SELECT 
  alert_type,
  severity,
  event_data,
  created_at
FROM security_alerts
WHERE alert_type = 'autoheal_action_taken'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Rollback & Emergency Procedures

### Instant Revert to DRY-RUN

**Option 1: Kill-Switch (Fastest)**
```bash
# Set edge function secret
GUARDIAN_AUTOHEAL_KILLSWITCH=true
```
**Effect**: Immediate (no restart)

**Option 2: Database Config**
```sql
UPDATE guardian_config 
SET value = '"dry_run"', updated_at = NOW() 
WHERE key = 'autoheal_mode';
```
**Effect**: Next health monitor run (~5 minutes)

### Disable Auto-Healing Entirely

```sql
-- Stop health monitor job
SELECT cron.unschedule('guardian-health-monitor');

-- Set mode to dry-run
UPDATE guardian_config 
SET value = '"dry_run"', updated_at = NOW() 
WHERE key = 'autoheal_mode';
```

### Clear Recent Actions (Reset Rate Limit)

```sql
-- CAUTION: Only use if stuck in rate-limited state during testing
DELETE FROM guardian_autoheal_actions
WHERE created_at > NOW() - INTERVAL '1 hour'
AND mode = 'dry_run'; -- Only clear test actions
```

---

## Integration with G-T4 Canary Report

**Metrics to Report**:
- Total active heals in 24h
- Actions by type (`worker_restart`, `disable_integration`, etc.)
- Success/failure/skipped counts
- Rate limit violations
- Runaway healing detection (>5 active heals → auto-disable)

**Auto-Disable Threshold**: >5 active heals in 24h

---

## Activation Checklist

- [x] Database schema deployed
- [x] Rate limiting function implemented
- [x] Edge function supports kill-switch
- [x] Fallback behavior for platform limitations
- [x] Alert creation on successful actions
- [ ] **Kill-switch tested** (awaiting manual test)
- [ ] **Rate limit tested** (awaiting manual test)
- [ ] **Active mode enabled** (manual step)
- [ ] **24h observation period** (pending G-T4)

---

## Next Steps

1. **Test Kill-Switch**: Verify instant revert to DRY-RUN
2. **Test Rate Limit**: Trigger 2 actions within 1 hour, verify second is skipped
3. **Enable Active Mode**: Set `autoheal_mode = 'active'` after testing
4. **Monitor 24h**: Observe for runaway healing or unexpected actions
5. **Generate Report**: Phase G-T4 will compile metrics and auto-disable if needed

---

**Phase G-T3 Complete** — Auto-heal active mode with guardrails implemented.
