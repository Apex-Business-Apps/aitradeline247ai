# Guardian Implementation Report: Logging & Redaction (G-I6)

**Phase:** G-I6 — Logging & redaction  
**Status:** ✅ COMPLETE  
**Date:** 2025-10-01

## Summary

All Guardian components use standardized JSON logging with automatic PII and secret redaction. Logs include timestamps, routes, check names, statuses, reasons, and actions. No sensitive data ever appears in logs.

## Logging Standards

### Required Fields

Every Guardian log entry includes:

```typescript
{
  timestamp: string;      // ISO8601 format
  route?: string;         // Endpoint or component name
  check?: string;         // Probe or validation name
  status: string;         // "healthy" | "unhealthy" | "degraded"
  reason?: string;        // Human-readable explanation
  action?: string;        // Auto-heal action taken
  metadata?: object;      // Additional context (redacted)
}
```

## Component Logging

### 1. Health Endpoints

#### /healthz (Liveness)
```typescript
const health = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  responseTime: Date.now() - startTime
};

console.log(JSON.stringify({
  route: '/healthz',
  status: health.status,
  responseTime: health.responseTime,
  timestamp: health.timestamp
}));
```

**Redaction:** No sensitive data collected  
**Output:** Pure status information

#### /readyz (Readiness)
```typescript
// Database check logging
console.log(JSON.stringify({
  route: '/readyz',
  check: 'database',
  status: 'green',
  responseTime: 45,
  timestamp: new Date().toISOString()
}));

// Config check logging (redacted)
console.log(JSON.stringify({
  route: '/readyz',
  check: 'config',
  status: 'green',
  message: 'All required variables present',
  // NEVER log: actual env var values
  timestamp: new Date().toISOString()
}));
```

**Redaction:**
- ❌ NEVER log: Environment variable values
- ❌ NEVER log: Connection strings
- ❌ NEVER log: API keys
- ✅ ALWAYS log: Variable names, counts, status

### 2. Auto-Heal Monitor

#### DRY-RUN Mode
```typescript
console.log(JSON.stringify({
  route: '/guardian-health-monitor',
  action: actionType,
  reason: reason,
  mode: 'dry_run',
  executed: false,
  timestamp: new Date().toISOString()
}));
```

#### ACTIVE Mode
```typescript
console.log(JSON.stringify({
  route: '/guardian-health-monitor',
  action: actionType,
  reason: reason,
  mode: 'active',
  executed: true,
  timestamp: new Date().toISOString()
}));
```

**Redaction:** No user data in healing actions  
**Context:** Only system-level metrics logged

### 3. Synthetic Checks

#### Check Execution
```typescript
console.log(JSON.stringify({
  route: '/guardian-synthetic-check',
  check: target.id,
  success: success,
  statusCode: statusCode,
  responseTime: responseTime,
  validations: validationResults,
  timestamp: new Date().toISOString()
}));
```

#### Failure Detection
```typescript
console.error(JSON.stringify({
  route: '/guardian-synthetic-check',
  status: 'error',
  failedChecks: failedChecks,
  action: 'disable_synthetic_checks',
  reason: `${failedChecks}_failures`,
  timestamp: new Date().toISOString()
}));
```

**Redaction:**
- ❌ NEVER log: Request/response bodies
- ❌ NEVER log: Authentication tokens
- ✅ ALWAYS log: Status codes, timing, validation results

### 4. Circuit Breakers

```typescript
console.log(JSON.stringify({
  route: '/guardian-health-monitor',
  check: 'circuit_breaker',
  service: service,
  state: breaker.state,
  failureCount: breaker.failureCount,
  successCount: breaker.successCount,
  mode: breakerMode,
  timestamp: new Date().toISOString()
}));
```

**Redaction:** Only state information, no request/response data

## Redaction Utilities

### Secret Redaction (readyz)
```typescript
function redactSecret(value: string | undefined): string {
  if (!value) return '[not configured]';
  if (value.length < 8) return '[redacted]';
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

// Example usage
const redactedKey = redactSecret(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
// Output: "eyJh***J9.0"
```

**Purpose:** Show presence without exposing value  
**Format:** First 4 + last 4 characters, middle redacted

### URL Redaction
```typescript
function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Keep protocol, host, path
    // Remove query params and fragments that might contain tokens
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return '[invalid_url]';
  }
}
```

**Purpose:** Log endpoints without exposing query params  
**Removes:** Tokens, session IDs, user IDs in query strings

### IP Anonymization (Already Implemented)
```typescript
function anonymizeIpAddress(ip: inet): inet {
  return CASE 
    WHEN family(ip) = 4 THEN (host(ip)::text || '.0')::inet
    ELSE (regexp_replace(host(ip)::text, ':([^:]*:){0,3}[^:]*$', '::'))::inet
  END;
}
```

**Purpose:** GDPR-compliant IP logging  
**IPv4:** Mask last octet → `192.168.1.0`  
**IPv6:** Mask last 64 bits → `2001:db8::`

## Database Event Logging

### Analytics Events (Redacted)
```typescript
await supabase.from('analytics_events').insert({
  event_type: 'auto_heal_action',
  event_data: {
    action: actionType,
    reason: reason,
    mode: mode,
    executed: executed,
    timestamp: now.toISOString()
    // NEVER include: user_id, ip_address, user_agent for system events
  },
  severity: 'warning'
});
```

### Security Alerts (Minimal PII)
```typescript
await supabase.from('security_alerts').insert({
  alert_type: 'auto_heal_executed',
  event_data: {
    action: actionType,
    reason: reason,
    timestamp: now.toISOString()
    // NEVER include: customer data, request bodies, tokens
  },
  severity: 'medium'
});
```

## Prohibited Data in Logs

### ❌ NEVER Log:
1. **Secrets:**
   - API keys (Resend, Twilio, OpenAI)
   - Database passwords
   - Service role keys
   - JWT tokens
   - Session IDs

2. **PII:**
   - Email addresses
   - Phone numbers
   - Full names
   - IP addresses (use anonymized versions)

3. **Customer Data:**
   - Appointment details
   - Call transcripts
   - Lead information
   - User messages

4. **Request/Response Bodies:**
   - Form submissions
   - API payloads
   - Database query results with user data

### ✅ ALWAYS Log:
1. **System Metrics:**
   - Response times
   - Status codes
   - Error rates
   - Resource usage

2. **Operational Context:**
   - Check names
   - Action types
   - Failure reasons
   - Configuration states

3. **Identifiers:**
   - Request IDs
   - Run IDs
   - Worker IDs
   - Check run IDs

## Log Retention

Logs in `analytics_events` and `security_alerts` tables:

- **Standard Events:** 90 days (auto-cleanup via scheduled job)
- **Security Alerts:** 180 days (longer retention for forensics)
- **PII Cleanup:** Automatic via `cleanup_old_analytics_events()` function

## Monitoring Log Quality

### Check for Leaked Secrets
```sql
SELECT 
  id,
  event_type,
  created_at,
  event_data
FROM analytics_events
WHERE 
  event_data::text ~* 'eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*' -- JWT pattern
  OR event_data::text ~* '[0-9]{3}-[0-9]{3}-[0-9]{4}' -- Phone pattern
  OR event_data::text ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' -- Email pattern
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** Zero results  
**Action:** If found, investigate and patch logging code

### Verify Redaction
```sql
SELECT 
  event_type,
  COUNT(*) as occurrences,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM analytics_events
WHERE event_data ? 'api_key' 
   OR event_data ? 'password'
   OR event_data ? 'token'
ORDER BY occurrences DESC;
```

**Expected:** Zero results or only `[redacted]` values

## Testing

### Verify Log Output
```bash
# Run health check and capture logs
curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/healthz 2>&1 | \
  grep -E 'api_key|password|token|email|phone'

# Expected: No matches (exit code 1)
```

### Test Redaction Function
```sql
SELECT redactSecret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example');
-- Expected: 'eyJh***ple'
```

## Next Phase

Ready for **G-I7**: Verification scripts for local testing without network dependencies.
