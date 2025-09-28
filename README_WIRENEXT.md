# Wire Next - Phase 2 Integration

## Overview
Phase 2 system integration that wires auth protection, audit logging, retention jobs, and legal compliance.

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
1. **Auth Protection** (`auth.protect.wire.mjs`)
   - JWT middleware for `/api/settings*`
   - JWT middleware for `/api/billing/portal`

2. **Audit Viewer** (`internal.audit.view.mjs`) 
   - GET `/internal/audit/recent` endpoint

3. **Retention Job** (`internal.retention.run.mjs`)
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
If wiring fails, check:
- Import paths are correct
- Supabase client is configured
- All dependencies are installed
- No circular imports