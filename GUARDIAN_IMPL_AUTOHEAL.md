# Guardian Implementation Report: Auto-Heal Policy (G-I4)

**Phase:** G-I4 — Auto-heal policy (safe by default)  
**Status:** ✅ COMPLETE  
**Date:** 2025-10-01

## Summary

Implemented auto-healing orchestrator that monitors health endpoints and synthetic check failures, triggering recovery actions based on predefined thresholds. Default mode is **DRY-RUN** (log-only) with emergency killswitch support.

## Changes Made

### 1. Auto-Heal Orchestrator

**File:** `supabase/functions/guardian-health-monitor/index.ts`

Core monitoring function that:
- Checks circuit breaker states
- Monitors recent synthetic check failures
- Triggers healing actions based on thresholds
- Respects rate limits and mode configuration

### 2. Healing Actions

#### Shed Background Tasks
```typescript
case 'shed_background_tasks':
  await supabase.from('guardian_config').upsert({
    key: 'background_tasks_enabled',
    value: { 
      enabled: false, 
      disabled_by: 'auto_heal', 
      timestamp: now.toISOString() 
    }
  });
```

**Trigger:** 3+ synthetic check failures in 15 minutes  
**Action:** Disable non-critical features to reduce load  
**Reversible:** Yes, via config update

#### Disable Synthetic Checks
```typescript
case 'disable_synthetic_checks':
  await supabase.from('guardian_config').upsert({
    key: 'synthetic_checks_enabled',
    value: { 
      enabled: false, 
      disabled_by: 'auto_heal', 
      timestamp: now.toISOString() 
    }
  });
```

**Trigger:** Multiple synthetic check failures  
**Action:** Stop synthetic checks to prevent alert fatigue  
**Reversible:** Yes, via config update

#### Worker Restart (Log Only)
```typescript
case 'worker_restart':
  console.log('⚠️ Worker restart requested - platform will auto-restart on exit');
```

**Trigger:** Consecutive /healthz failures (future)  
**Action:** Request platform restart (platform-dependent)  
**Note:** Currently log-only, requires platform support

## Operational Modes

### DRY-RUN (Default)
```typescript
if (mode === 'dry_run') {
  console.log(`🔍 DRY-RUN: Would execute auto-heal action: ${actionType}`);
  
  await supabase.from('analytics_events').insert({
    event_type: 'auto_heal_action',
    event_data: {
      action: actionType,
      reason,
      mode: 'dry_run',
      executed: false
    },
    severity: 'info'
  });
  return;
}
```

**Behavior:** Log actions without execution  
**Safety:** No system changes, pure observation  
**Use Case:** Initial deployment, testing

### ACTIVE Mode
```typescript
console.log(`🔧 ACTIVE: Executing auto-heal action: ${actionType}`);

// Execute healing action
switch (actionType) {
  case 'shed_background_tasks': /* ... */ break;
  case 'disable_synthetic_checks': /* ... */ break;
  case 'worker_restart': /* ... */ break;
}

// Log execution
await supabase.from('analytics_events').insert({
  event_type: 'auto_heal_action',
  event_data: { action: actionType, mode: 'active', executed: true },
  severity: 'warning'
});
```

**Behavior:** Execute healing actions  
**Safety:** Rate-limited, logged, alerted  
**Use Case:** Production after validation

## Safety Features

### 1. Rate Limiting
```typescript
const { data: recentHeals } = await supabase
  .from('analytics_events')
  .select('created_at')
  .eq('event_type', 'auto_heal_action')
  .gte('created_at', new Date(now.getTime() - 5 * 60 * 1000).toISOString())
  .limit(1);

if (recentHeals && recentHeals.length > 0) {
  console.log(`⏳ Auto-heal rate limited, skipping action: ${actionType}`);
  return;
}
```

**Limit:** Max 1 action per 5 minutes  
**Prevents:** Healing loops, excessive actions

### 2. Emergency Killswitch
```typescript
const killswitch = Deno.env.get('GUARDIAN_AUTOHEAL_KILLSWITCH');
if (killswitch === 'true') {
  autoHealMode = 'dry_run';
  console.log('🛑 KILLSWITCH ACTIVE: Auto-heal forced to DRY-RUN mode');
}
```

**Environment Variable:** `GUARDIAN_AUTOHEAL_KILLSWITCH=true`  
**Effect:** Force DRY-RUN mode regardless of config  
**Use Case:** Emergency disable during incidents

### 3. Security Alerts
```typescript
await supabase.from('security_alerts').insert({
  alert_type: 'auto_heal_executed',
  event_data: {
    action: actionType,
    reason,
    timestamp: now.toISOString()
  },
  severity: 'medium'
});
```

**Purpose:** High-visibility notification of healing actions  
**Severity:** Medium (informational) or High (failures)  
**Integration:** Can trigger external alerts (Slack, PagerDuty)

## Configuration

Auto-heal mode controlled via `guardian_config` table:

```sql
INSERT INTO guardian_config (key, value) VALUES
  ('autoheal_mode', '{"mode": "dry_run"}');
```

To enable active mode:
```sql
UPDATE guardian_config 
SET value = '{"mode": "active"}'::jsonb 
WHERE key = 'autoheal_mode';
```

## Monitoring Thresholds

### Synthetic Check Failures
```typescript
const { data: recentChecks } = await supabase
  .from('guardian_synthetic_checks')
  .select('success, created_at, target_id')
  .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
  .limit(10);

const failures = recentChecks?.filter(c => !c.success) || [];

if (failures.length >= 3) {
  await performAutoHeal(
    `${failures.length} synthetic check failures detected`,
    'disable_synthetic_checks',
    supabase,
    autoHealMode
  );
}
```

**Threshold:** 3+ failures in 15 minutes  
**Action:** Disable synthetic checks  
**Rationale:** Prevent alert fatigue from cascading failures

## Response Format

```json
{
  "status": "healthy",
  "autoheal_mode": "dry_run",
  "circuit_breaker_mode": "observe_only",
  "recent_failures": 0,
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

## Testing

### Verify Auto-Heal Mode
```bash
curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-health-monitor
```

### Check Action Logs
```sql
SELECT 
  event_type,
  event_data->>'action' as action,
  event_data->>'mode' as mode,
  event_data->>'executed' as executed,
  created_at
FROM analytics_events
WHERE event_type = 'auto_heal_action'
ORDER BY created_at DESC
LIMIT 10;
```

### Trigger Test (DRY-RUN)
1. Artificially create 3+ failed synthetic checks
2. Invoke guardian-health-monitor
3. Verify DRY-RUN log entry created
4. Confirm no actual config changes

## Activation Checklist

Before enabling ACTIVE mode:

- [ ] Verify DRY-RUN logs show correct triggers
- [ ] Test healing actions in staging
- [ ] Confirm rate limiting works
- [ ] Set up external alerting for security_alerts
- [ ] Document rollback procedures
- [ ] Train team on killswitch usage
- [ ] Monitor for false positives

## Rollback Procedures

### Immediate Disable
```bash
# Set environment variable
export GUARDIAN_AUTOHEAL_KILLSWITCH=true

# Or update config
psql -c "UPDATE guardian_config SET value = '{\"mode\": \"dry_run\"}'::jsonb WHERE key = 'autoheal_mode';"
```

### Re-enable Features
```sql
-- Re-enable background tasks
UPDATE guardian_config 
SET value = '{"enabled": true}'::jsonb 
WHERE key = 'background_tasks_enabled';

-- Re-enable synthetic checks
UPDATE guardian_config 
SET value = '{"enabled": true}'::jsonb 
WHERE key = 'synthetic_checks_enabled';
```

## Next Phase

Ready for **G-I5**: Scheduled synthetic check job with concurrency protection.
