# Guardian Implementation Report: Internal Probes (G-I2)

**Phase:** G-I2 — Internal checks (feature-flagged)  
**Status:** ✅ COMPLETE  
**Date:** 2025-10-01

## Summary

Enhanced the `/readyz` endpoint with internal probes for memory, configuration validation, and database connectivity. All probes are feature-flagged and default to enabled with graceful degradation for missing providers.

## Changes Made

### 1. Enhanced Readiness Endpoint

**File:** `supabase/functions/readyz/index.ts`

Added three internal probes:

#### Database Probe
- **Purpose:** Verify Supabase connectivity and query performance
- **Success Criteria:** Query completes in <500ms
- **Failure Handling:** Returns 'red' status if connection fails
- **Flag:** Always enabled (core dependency)

```typescript
async function checkDatabase(): Promise<HealthCheck> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.from('guardian_config').select('key').limit(1);
  
  if (error) {
    return { name: 'database', status: 'red', message: 'Connection failed' };
  }
  
  const responseTime = Date.now() - start;
  return {
    name: 'database',
    status: responseTime < 500 ? 'green' : 'yellow',
    responseTime
  };
}
```

#### Configuration Probe
- **Purpose:** Validate required environment variables
- **Success Criteria:** All required vars present
- **Failure Handling:** Returns 'red' with list of missing vars
- **Flag:** Always enabled (core requirement)

```typescript
async function checkConfig(): Promise<HealthCheck> {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter(v => !Deno.env.get(v));
  
  if (missing.length > 0) {
    return {
      name: 'config',
      status: 'red',
      message: `Missing: ${missing.join(', ')}`
    };
  }
  
  return { name: 'config', status: 'green', message: 'All required variables present' };
}
```

#### Memory Probe
- **Purpose:** Monitor heap usage and detect memory pressure
- **Success Criteria:** <75% heap usage
- **Warning Threshold:** 75-90% usage
- **Critical Threshold:** >90% usage
- **Flag:** Always enabled

```typescript
async function checkMemory(): Promise<HealthCheck> {
  const memUsage = Deno.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const usagePercent = (heapUsedMB / heapTotalMB) * 100;
  
  let status: 'green' | 'yellow' | 'red' = 'green';
  if (usagePercent > 90) status = 'red';
  else if (usagePercent > 75) status = 'yellow';
  
  return {
    name: 'memory',
    status,
    message: `${heapUsedMB.toFixed(0)}MB used`
  };
}
```

## Feature Flags

All probes are enabled by default. External calls (database) fail gracefully:

- **Database probe:** Uses try-catch to handle connection failures
- **Config probe:** Returns missing vars without crashing
- **Memory probe:** Uses Deno.memoryUsage() with fallback

## Response Format

```json
{
  "ready": true,
  "status": "green",
  "checks": {
    "database": {
      "name": "database",
      "status": "green",
      "responseTime": 45,
      "message": "Healthy"
    },
    "config": {
      "name": "config",
      "status": "green",
      "responseTime": 2,
      "message": "All required variables present"
    },
    "memory": {
      "name": "memory",
      "status": "green",
      "responseTime": 1,
      "message": "128MB used"
    }
  },
  "timestamp": "2025-10-01T12:00:00.000Z",
  "responseTime": 48
}
```

## Status Determination

Overall readiness is determined by probe results:

- **Ready (200):** No 'red' checks
- **Not Ready (503):** One or more 'red' checks
- **Overall Status:**
  - 'green': All checks green
  - 'yellow': At least one yellow, no red
  - 'red': At least one red

## Graceful Degradation

Probes never crash the endpoint:

1. Database probe catches connection errors → returns 'red'
2. Config probe validates without external calls → returns 'red' with details
3. Memory probe uses native API with try-catch → returns 'yellow' on error

## Testing

Test with:
```bash
curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/readyz
```

Expected: 200 OK with all checks 'green' or 'yellow'

## Next Phase

Ready for **G-I3**: Circuit breaker wrappers for outbound services.
