# Audit System

## Overview
Audit logging system that tracks critical business events for compliance and security monitoring.

## Files Created
- `server/lib/audit.mjs` - Core audit logging function
- `server/routes/internal.audit.recent.mjs` - Internal audit viewer API

## Usage

### Logging Events
```javascript
import { audit } from '../lib/audit.mjs';

// Log a settings update
await audit({
  action: 'settings.update',
  org_id: 'uuid-here',
  user_id: 'uuid-here', 
  target: 'phone_number',
  payload: { old_value: '+1234567890', new_value: '+1987654321' }
});

// Log a CTA callback
await audit({
  action: 'cta.callback',
  org_id: 'uuid-here',
  user_id: null, // anonymous
  target: 'call_sid_here',
  payload: { callback_type: 'missed_call', source: 'email' }
});

// Log billing checkout
await audit({
  action: 'billing.checkout',
  org_id: 'uuid-here',
  user_id: 'uuid-here',
  target: 'stripe_session_id',
  payload: { amount: 2500, currency: 'cad' }
});
```

### Viewing Audit Logs
```bash
# Get recent audit events
GET /internal/audit/recent?org_id=uuid&limit=50

# Response
{
  "ok": true,
  "events": [...],
  "count": 25
}
```

## Integration Points
Add audit calls after:
1. Successful POST `/api/settings`
2. GET `/a/c?t=...` callback success  
3. POST `/api/billing/checkout` creation
4. User authentication events

## Security
- Audit logs are admin-only via RLS policies
- Uses service role key for reliable logging
- Captures user context when available