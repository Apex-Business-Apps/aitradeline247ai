# Guardian Phase G-T4: 24-Hour Canary Launch Report

**Status**: 🔄 PENDING (Report Generator Ready)  
**Date**: 2025-10-01  
**Phase**: G-T4 — Canary Report & Auto-Disable Logic

---

## Overview

The Guardian 24-hour canary report system is now deployed and ready to generate automated health reports. The system will:

1. **Collect Metrics**: Synthetic check success rates, auto-heal actions, circuit breaker observations
2. **Detect Anomalies**: Failure rate >0.5%, runaway healing (>5 actions in 24h)
3. **Auto-Disable**: Turn off synthetic checks and revert auto-heal to DRY-RUN if thresholds exceeded
4. **Generate Report**: Compile comprehensive JSON report with status and recommendations

---

## Report Structure

### Generated Report Schema

```json
{
  "report_type": "24h_canary",
  "period": {
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-10-02T00:00:00Z"
  },
  "synthetic_checks": {
    "total": 240,
    "successful": 238,
    "failed": 2,
    "success_rate": 99.17
  },
  "autoheal_actions": {
    "total": 3,
    "recent": [
      {
        "action_type": "observe_only",
        "trigger_reason": "multiple_synthetic_check_failures",
        "status": "success",
        "mode": "active",
        "created_at": "2025-10-01T14:32:15Z"
      }
    ],
    "runaway_detected": false
  },
  "circuit_breaker_events": {
    "total": 12,
    "recent": [...]
  },
  "auto_disable": {
    "triggered": false,
    "reason": null,
    "failure_rate": 0.83
  },
  "status": "active",
  "generated_at": "2025-10-02T00:00:05Z"
}
```

---

## Auto-Disable Thresholds

### Failure Rate Threshold

**Trigger**: Synthetic check failure rate >0.5% in 24 hours

**Calculation**:
```sql
failure_rate = (failed_checks / total_checks) * 100
-- Example: 2 failed / 240 total = 0.83% > 0.5% → TRIGGER
```

**Action**:
1. Set `guardian_config.synthetic_enabled = false`
2. Alert: `guardian_auto_disabled` with reason `high_failure_rate`

### Runaway Healing Detection

**Trigger**: >5 auto-heal actions in active mode within 24 hours

**Query**:
```sql
SELECT COUNT(*) 
FROM guardian_autoheal_actions
WHERE mode = 'active'
AND status IN ('success', 'initiated')
AND created_at > NOW() - INTERVAL '24 hours';

-- If count > 5 → TRIGGER
```

**Action**:
1. Set `guardian_config.autoheal_mode = 'dry_run'`
2. Alert: `guardian_auto_disabled` with reason `runaway_healing`

---

## Report Generation

### Edge Function: guardian-report-generator

**Endpoint**: `guardian-report-generator`

**Invocation**:
```bash
curl -X POST \
  https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-report-generator \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Schedule** (via pg_cron):
```sql
-- Run once daily at 00:05 UTC
SELECT cron.schedule(
  'guardian-24h-report',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-report-generator',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### Report Storage

**Table**: `analytics_events`

**Entry**:
```sql
INSERT INTO analytics_events (
  event_type,
  event_data,
  severity
) VALUES (
  'guardian_24h_report',
  <full_report_json>,
  CASE WHEN auto_disabled THEN 'critical' ELSE 'info' END
);
```

**Retrieval**:
```sql
SELECT 
  event_data,
  severity,
  created_at
FROM analytics_events
WHERE event_type = 'guardian_24h_report'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Metrics Collected

### 1. Synthetic Check Metrics

**Database Function**: `get_guardian_metrics(start_time, end_time)`

**Returns**:
```json
{
  "synthetic_checks": {
    "total": 240,
    "successful": 238,
    "failed": 2,
    "success_rate": 99.17
  }
}
```

**Query**:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  ROUND((COUNT(*) FILTER (WHERE success = true)::numeric / COUNT(*)::numeric) * 100, 2) as success_rate
FROM guardian_synthetic_checks
WHERE created_at BETWEEN '2025-10-01 00:00:00' AND '2025-10-02 00:00:00';
```

### 2. Auto-Heal Actions

**Count**:
```sql
SELECT COUNT(*) 
FROM guardian_autoheal_actions
WHERE mode = 'active'
AND created_at BETWEEN '2025-10-01 00:00:00' AND '2025-10-02 00:00:00';
```

**Recent Actions**:
```sql
SELECT 
  action_type,
  trigger_reason,
  status,
  mode,
  created_at
FROM guardian_autoheal_actions
WHERE created_at BETWEEN '2025-10-01 00:00:00' AND '2025-10-02 00:00:00'
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Circuit Breaker Events

**Transition Count**:
```sql
SELECT COUNT(*) 
FROM guardian_circuit_breaker_events
WHERE state != previous_state
AND created_at BETWEEN '2025-10-01 00:00:00' AND '2025-10-02 00:00:00';
```

**Recent Events**:
```sql
SELECT 
  service_name,
  state,
  previous_state,
  failure_count,
  success_count,
  created_at
FROM guardian_circuit_breaker_events
WHERE created_at BETWEEN '2025-10-01 00:00:00' AND '2025-10-02 00:00:00'
ORDER BY created_at DESC
LIMIT 100;
```

---

## Auto-Disable Logic

### Implementation (guardian-report-generator)

```typescript
// Calculate failure rate
const failureRate = 100 - metrics.synthetic_checks.success_rate;

// Check runaway healing
const runawayDetected = (recentHeals?.length || 0) > 5;

// Auto-disable if thresholds exceeded
if (failureRate > 0.5 || runawayDetected) {
  // Disable synthetic checks
  await supabase
    .from('guardian_config')
    .update({ value: false, updated_at: NOW() })
    .eq('key', 'synthetic_enabled');

  // Revert auto-heal to dry-run
  await supabase
    .from('guardian_config')
    .update({ value: 'dry_run', updated_at: NOW() })
    .eq('key', 'autoheal_mode');

  // Create critical alert
  await supabase.from('security_alerts').insert({
    alert_type: 'guardian_auto_disabled',
    severity: 'critical',
    event_data: {
      reason: failureRate > 0.5 ? 'high_failure_rate' : 'runaway_healing',
      failure_rate: failureRate,
      heal_count: recentHeals?.length || 0,
      disabled_at: new Date().toISOString()
    }
  });
}
```

### Verification Query

```sql
-- Check if auto-disable was triggered
SELECT 
  alert_type,
  severity,
  event_data,
  created_at
FROM security_alerts
WHERE alert_type = 'guardian_auto_disabled'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Report Scenarios

### Scenario 1: Healthy Operation (No Disable)

**Inputs**:
- Synthetic checks: 240 total, 240 successful
- Auto-heal actions: 2 (both observe-only)
- Circuit breaker transitions: 5

**Output**:
```json
{
  "synthetic_checks": { "success_rate": 100.0 },
  "autoheal_actions": { "total": 2, "runaway_detected": false },
  "auto_disable": {
    "triggered": false,
    "reason": null,
    "failure_rate": 0.0
  },
  "status": "active"
}
```

**Alert**: None

### Scenario 2: High Failure Rate (Auto-Disable)

**Inputs**:
- Synthetic checks: 240 total, 237 successful, 3 failed
- Failure rate: 1.25% (>0.5% threshold)

**Output**:
```json
{
  "synthetic_checks": { "success_rate": 98.75 },
  "auto_disable": {
    "triggered": true,
    "reason": "high_failure_rate",
    "failure_rate": 1.25
  },
  "status": "disabled"
}
```

**Actions**:
1. `guardian_config.synthetic_enabled = false`
2. Alert: `guardian_auto_disabled` (critical)

### Scenario 3: Runaway Healing (Auto-Disable)

**Inputs**:
- Synthetic checks: 240 total, 239 successful
- Auto-heal actions: 7 (active mode)

**Output**:
```json
{
  "synthetic_checks": { "success_rate": 99.58 },
  "autoheal_actions": { "total": 7, "runaway_detected": true },
  "auto_disable": {
    "triggered": true,
    "reason": "runaway_healing",
    "failure_rate": 0.42
  },
  "status": "disabled"
}
```

**Actions**:
1. `guardian_config.autoheal_mode = 'dry_run'`
2. Alert: `guardian_auto_disabled` (critical)

---

## Manual Report Generation

### Trigger Report Immediately

```bash
curl -X POST \
  https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-report-generator \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  | jq .
```

### View Latest Report

```sql
SELECT 
  event_data->'synthetic_checks'->>'success_rate' as success_rate,
  event_data->'autoheal_actions'->>'total' as autoheal_count,
  event_data->'auto_disable'->>'triggered' as auto_disabled,
  event_data->>'status' as status,
  severity,
  created_at
FROM analytics_events
WHERE event_type = 'guardian_24h_report'
ORDER BY created_at DESC
LIMIT 1;
```

### Historical Reports (Last 7 Days)

```sql
SELECT 
  DATE(created_at) as report_date,
  event_data->'synthetic_checks'->>'success_rate' as success_rate,
  event_data->'autoheal_actions'->>'runaway_detected' as runaway,
  event_data->'auto_disable'->>'triggered' as auto_disabled,
  severity
FROM analytics_events
WHERE event_type = 'guardian_24h_report'
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## Recovery After Auto-Disable

### Investigation Steps

1. **Review Report**:
   ```sql
   SELECT event_data 
   FROM analytics_events 
   WHERE event_type = 'guardian_24h_report' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

2. **Identify Root Cause**:
   - High failure rate: Check `guardian_synthetic_checks` for failed targets
   - Runaway healing: Check `guardian_autoheal_actions` for trigger patterns

3. **Review Alerts**:
   ```sql
   SELECT * 
   FROM security_alerts 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

### Re-Enable After Fix

```sql
-- Re-enable synthetic checks (after fixing root cause)
UPDATE guardian_config 
SET value = true, updated_at = NOW() 
WHERE key = 'synthetic_enabled';

-- Re-enable auto-heal active mode (if safe)
UPDATE guardian_config 
SET value = '"active"', updated_at = NOW() 
WHERE key = 'autoheal_mode';
```

---

## Validation Checklist

- [x] Database function `get_guardian_metrics` deployed
- [x] Edge function `guardian-report-generator` deployed
- [x] Auto-disable logic implemented (failure rate & runaway)
- [x] Report stored in `analytics_events`
- [x] Critical alerts created on auto-disable
- [ ] **pg_cron scheduled** (manual step: daily at 00:05 UTC)
- [ ] **24h observation period started** (pending activation)
- [ ] **First report generated** (after 24h)
- [ ] **Auto-disable tested** (simulate high failure rate)

---

## Next Steps

1. **Wait 24 Hours**: Let Guardian run in canary mode
2. **Generate First Report**: Run `guardian-report-generator` after 24h
3. **Review Metrics**: Check success rate, heal actions, breaker events
4. **Assess Status**: Verify no auto-disable triggered
5. **Document Results**: Update this file with actual 24h data
6. **Decision**: Continue to full production or rollback

---

## Emergency Disable

```sql
-- Manually disable all Guardian systems
UPDATE guardian_config SET value = false WHERE key = 'synthetic_enabled';
UPDATE guardian_config SET value = '"dry_run"' WHERE key = 'autoheal_mode';
UPDATE guardian_config SET value = '"disabled"' WHERE key = 'circuit_breaker_mode';

-- Stop all cron jobs
SELECT cron.unschedule('guardian-synthetic-checks');
SELECT cron.unschedule('guardian-health-monitor');
SELECT cron.unschedule('guardian-24h-report');
```

---

**Phase G-T4 Ready** — Report generator deployed, awaiting 24-hour canary period.

---

## [TO BE UPDATED AFTER 24H]

**Actual Results Section** (update after first real report):

```
### First 24h Canary Results

**Period**: YYYY-MM-DD HH:MM to YYYY-MM-DD HH:MM

**Synthetic Checks**:
- Total: XXX
- Successful: XXX
- Failed: XXX
- Success Rate: XX.XX%

**Auto-Heal Actions**:
- Total: X
- Active Mode: X
- Runaway Detected: Yes/No

**Circuit Breaker Events**:
- Transitions: X
- Services Affected: [list]

**Auto-Disable**:
- Triggered: Yes/No
- Reason: [if triggered]

**Decision**: [CONTINUE / ROLLBACK]
```
