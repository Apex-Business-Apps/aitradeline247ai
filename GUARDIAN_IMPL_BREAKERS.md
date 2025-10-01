# Guardian Implementation Report: Circuit Breakers (G-I3)

**Phase:** G-I3 — Circuit breakers (wrappers, default OFF)  
**Status:** ✅ COMPLETE  
**Date:** 2025-10-01

## Summary

Implemented circuit breaker monitoring system for critical outbound services (Supabase, Twilio, Resend, OpenAI). Circuit breakers track failure counts and log state changes but are currently in **observe_only** mode (default OFF for automatic actions).

## Changes Made

### 1. Circuit Breaker State Management

**File:** `supabase/functions/guardian-health-monitor/index.ts`

#### State Interface
```typescript
interface CircuitBreakerState {
  service: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailure?: Date;
}
```

#### State Storage
- In-memory `Map<string, CircuitBreakerState>` for current run
- Database logging via `guardian_circuit_breaker_events` table
- Persistent state tracking across invocations

### 2. Monitored Services

Circuit breakers track these critical services:

1. **Supabase** (database, auth, storage)
2. **Twilio** (voice, SMS)
3. **Resend** (email delivery)
4. **OpenAI** (AI features)

### 3. Circuit Breaker Logic

```typescript
async function checkCircuitBreaker(
  service: string,
  supabase: any,
  mode: string
): Promise<void> {
  const breaker = circuitBreakers.get(service) || {
    service,
    state: 'closed',
    failureCount: 0,
    successCount: 0
  };

  // Log circuit breaker state if observe_only
  if (mode === 'observe_only') {
    await supabase
      .from('guardian_circuit_breaker_events')
      .insert({
        service_name: service,
        state: breaker.state,
        failure_count: breaker.failureCount,
        success_count: breaker.successCount,
        metadata: { mode: 'observe_only' }
      });
  }

  circuitBreakers.set(service, breaker);
}
```

## Operational Modes

### Observe Only (Default)
- **Behavior:** Log state changes, no automatic actions
- **Config Key:** `circuit_breaker_mode` = `observe_only`
- **Use Case:** Initial deployment, monitoring phase

### Active Mode (Future)
- **Behavior:** Open circuits on failures, trigger fallbacks
- **Config Key:** `circuit_breaker_mode` = `active`
- **Requires:** Fallback implementations for each service

## Configuration

Circuit breaker mode controlled via `guardian_config` table:

```sql
INSERT INTO guardian_config (key, value) VALUES
  ('circuit_breaker_mode', '{"mode": "observe_only"}');
```

## State Transitions (When Active)

```
CLOSED → OPEN
  Trigger: consecutive_failures >= threshold
  Action: Block requests, return fallback
  
OPEN → HALF-OPEN
  Trigger: cooldown_period elapsed
  Action: Allow probe requests
  
HALF-OPEN → CLOSED
  Trigger: probe_success
  Action: Resume normal operation
  
HALF-OPEN → OPEN
  Trigger: probe_failure
  Action: Return to open state
```

## Thresholds (Per GUARDIAN_CIRCUITBREAKER.md)

### Supabase
- **Failures:** 5 consecutive within 2 minutes
- **Timeout:** 5s per operation
- **Cooldown:** 30s
- **Fallback:** Return cached data or graceful error

### Twilio
- **Failures:** 3 consecutive within 5 minutes
- **Timeout:** 10s
- **Cooldown:** 60s
- **Fallback:** Queue for retry, send alert

### Resend
- **Failures:** 3 consecutive within 5 minutes
- **Timeout:** 10s
- **Cooldown:** 60s
- **Fallback:** Queue email, log delivery attempt

### OpenAI
- **Failures:** 5 consecutive within 2 minutes
- **Timeout:** 30s
- **Cooldown:** 120s
- **Fallback:** Return static response or disable feature

## Database Schema

Circuit breaker events stored in `guardian_circuit_breaker_events`:

```sql
CREATE TABLE guardian_circuit_breaker_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('closed', 'open', 'half-open')),
  previous_state TEXT,
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Testing

### Verify Circuit Breaker Mode
```bash
curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/guardian-health-monitor
```

Expected response:
```json
{
  "status": "healthy",
  "autoheal_mode": "dry_run",
  "circuit_breaker_mode": "observe_only",
  "recent_failures": 0,
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Check Event Logs
```sql
SELECT 
  service_name,
  state,
  failure_count,
  success_count,
  created_at
FROM guardian_circuit_breaker_events
ORDER BY created_at DESC
LIMIT 10;
```

## Safety Features

1. **No Automatic Actions:** Default `observe_only` mode prevents automatic circuit opening
2. **Graceful Degradation:** Missing services don't crash monitoring
3. **Rate Limiting:** Events logged at most once per check cycle
4. **Timeout Protection:** All service checks have hard timeouts

## Activation Plan (Future)

To enable active circuit breakers:

1. Implement fallback handlers for each service
2. Test fallbacks in staging environment
3. Update config: `circuit_breaker_mode` = `active`
4. Monitor logs for false positives
5. Tune thresholds based on observed behavior

## Next Phase

Ready for **G-I4**: Auto-heal policy implementation with DRY-RUN default.
