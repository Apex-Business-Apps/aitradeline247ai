# Guardian Implementation Report: Verification Scripts (G-I7)

**Phase:** G-I7 — Verify scripts (local-only)  
**Status:** ✅ COMPLETE  
**Date:** 2025-10-01

## Summary

Created local verification script `scripts/verify-guardian.sh` that tests health endpoints and Guardian components without requiring networked providers. Validates response formats, required fields, and operational modes.

## Verification Script

**File:** `scripts/verify-guardian.sh`

### Features

1. **Endpoint Testing:** Checks /healthz and /readyz
2. **Response Validation:** Verifies JSON structure and required fields
3. **Status Verification:** Confirms health check states
4. **Mode Checking:** Validates auto-heal and circuit breaker modes
5. **Human-Readable Output:** Clear pass/fail indicators

### Usage

#### Local Testing (Supabase CLI)
```bash
# Start local Supabase instance
supabase start

# Run verification
./scripts/verify-guardian.sh

# Or specify custom base URL
GUARDIAN_BASE_URL=http://localhost:54321/functions/v1 ./scripts/verify-guardian.sh
```

#### Production Testing
```bash
export GUARDIAN_BASE_URL=https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1
export SUPABASE_ANON_KEY=your-anon-key
./scripts/verify-guardian.sh
```

### Output Format

```
🛡️ Guardian Verification Suite
================================

Testing /healthz endpoint...
✅ /healthz returned 200 OK
   Response: {"status":"healthy","timestamp":"2025-10-01T12:00:00.000Z","responseTime":15}
   ✅ Status is 'healthy'
   ✅ Timestamp present

Testing /readyz endpoint...
✅ /readyz returned 200
   Response: {"ready":true,"status":"green","checks":{...},"timestamp":"..."}
   ✅ Ready status: true
   ✅ Health checks present
      - database: green
      - config: green
      - memory: green
   ✅ Timestamp present

Testing guardian-health-monitor endpoint...
✅ guardian-health-monitor returned 200 OK
   Response: {"status":"healthy","autoheal_mode":"dry_run",...}
   Auto-heal mode: dry_run
   ✅ Auto-heal in DRY-RUN mode (safe default)

================================
✅ Guardian verification complete

Summary:
  - /healthz: operational
  - /readyz: operational
  - guardian-health-monitor: operational
  - Auto-heal: DRY-RUN mode (safe)

Next steps:
  1. Monitor health endpoints in production
  2. Review circuit breaker configurations
  3. Test synthetic checks with: npm run verify:synthetic
```

## Test Cases

### 1. Healthz Endpoint

```bash
HEALTHZ_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/healthz")
HEALTHZ_CODE=$(echo "$HEALTHZ_RESPONSE" | tail -n1)
HEALTHZ_BODY=$(echo "$HEALTHZ_RESPONSE" | head -n-1)
```

**Checks:**
- ✅ HTTP 200 status code
- ✅ JSON response contains `status` field
- ✅ Status value is `"healthy"`
- ✅ `timestamp` field present
- ✅ `responseTime` field present

**Pass Criteria:** All checks pass  
**Fail Action:** Exit with code 1, show error details

### 2. Readyz Endpoint

```bash
READYZ_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/readyz")
READYZ_CODE=$(echo "$READYZ_RESPONSE" | tail -n1)
READYZ_BODY=$(echo "$READYZ_RESPONSE" | head -n-1)
```

**Checks:**
- ✅ HTTP 200 or 503 status code (both valid)
- ✅ JSON response contains `ready` field
- ✅ JSON response contains `checks` object
- ✅ Each check has `name`, `status`, `message`
- ✅ Check statuses are `green`, `yellow`, or `red`
- ✅ `timestamp` field present

**Pass Criteria:** All checks pass  
**Fail Action:** Exit with code 1, show check details

### 3. Guardian Health Monitor

```bash
MONITOR_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${ANON_KEY}" \
  "${BASE_URL}/guardian-health-monitor")
```

**Checks:**
- ✅ HTTP 200 status code
- ✅ JSON response contains `autoheal_mode` field
- ✅ Mode is `"dry_run"` (safe default)
- ✅ JSON response contains `circuit_breaker_mode` field
- ✅ `recent_failures` count present

**Pass Criteria:** All checks pass  
**Warning:** Non-fatal if endpoint not reachable (optional component)

## Integration with Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "verify:health": "./scripts/verify-guardian.sh",
    "verify:guardian": "./scripts/verify-guardian.sh",
    "test:guardian": "npm run verify:guardian"
  }
}
```

Usage:
```bash
npm run verify:health
npm run verify:guardian
npm test:guardian
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Guardian Health Check

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  verify-guardian:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Supabase CLI
        run: |
          brew install supabase/tap/supabase
      
      - name: Start Supabase
        run: supabase start
      
      - name: Verify Guardian
        run: |
          chmod +x scripts/verify-guardian.sh
          ./scripts/verify-guardian.sh
      
      - name: Stop Supabase
        if: always()
        run: supabase stop
```

## Troubleshooting

### Connection Refused
```
Error: curl: (7) Failed to connect to localhost port 54321: Connection refused
```

**Solution:**
1. Start Supabase: `supabase start`
2. Check status: `supabase status`
3. Verify Functions deployed: `supabase functions list`

### Missing jq Command
```
Error: jq: command not found
```

**Solution:**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Alpine
apk add jq
```

### 401 Unauthorized
```
Error: 401 Unauthorized from guardian-health-monitor
```

**Solution:**
1. Set `SUPABASE_ANON_KEY` environment variable
2. Or update script to use service_role key for testing

### Health Check Failures

```
❌ /readyz returned 503
   Response: {"ready":false,"status":"red","checks":{...}}
```

**Solution:**
1. Check which probe failed: Look at `checks` object
2. Database red: Verify Supabase running, check connection
3. Config red: Ensure required env vars set
4. Memory red: Restart service or check for leaks

## Expected Test Duration

- **Healthz check:** ~15-50ms
- **Readyz check:** ~50-500ms (includes database query)
- **Guardian monitor:** ~100-1000ms (includes database reads)
- **Total suite:** <5 seconds

## Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed
- `127`: Script dependency missing (jq, curl)

## Next Phase

Ready for **G-I8**: Final acceptance report confirming all Guardian components.
