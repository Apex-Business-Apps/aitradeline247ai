# Wire Next - Phase 2 Integration

## Overview
Phase 2 system integration that wires auth protection, audit logging, retention jobs, and existing onboarding systems into a single import.

## Files Created
- `server/boot/wire.next.mjs` - Main integration point

## Integration
Add to your main server boot process:

```javascript
// In your main server file, after existing wires
import { wireNext } from './server/boot/wire.next.mjs';

// After wireStatus(app), wireEnhancements(app), etc.
await wireNext(app);
```

## What Gets Wired
1. **Existing Onboarding** (`onboarding.wire.mjs`)
   - Gracefully handles if not found
   
2. **Auth Protection** (`auth.protect.wire.mjs`)
   - JWT middleware for `/api/settings*`, `/api/billing/portal`

3. **Audit Viewer** (`internal.audit.recent.mjs`) 
   - GET `/internal/audit/recent` endpoint

4. **Retention Job** (`internal.retention.run.mjs`)
   - POST `/internal/retention/run` endpoint

## Startup Log
Look for these console messages:
```
✅ Auth protection wired for API routes
✅ Audit viewer wired at /internal/audit/recent  
✅ Retention job wired at /internal/retention/run
✅ Phase 2 (Next) wiring complete
```

## Error Handling
- Graceful handling of missing onboarding wire
- Logs errors but continues with other wiring
- Each system wire is independent

## Order of Operations
1. Call wireNext(app) after status/enhancements wiring
2. Ensures auth protection is applied to existing routes
3. Audit and retention endpoints are available for ops