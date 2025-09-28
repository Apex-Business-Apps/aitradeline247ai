# Audit System

## Overview
Audit logging system that tracks critical business events for compliance and security monitoring.

## Files Created
- `server/lib/audit.mjs` - Core audit logging function
- `server/routes/internal.audit.view.mjs` - Internal audit viewer API

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

## Event Types
- `audit.settings.update` - Settings changes
- `audit.cta.callback` - CTA interactions  
- `audit.billing.checkout` - Payment events
- `audit.user.login` - User authentication

## Integration Points
Audit calls should be added after:
1. Successful POST `/api/settings`
2. GET `/a/c?t=...` callback success
3. POST `/api/billing/checkout` creation
4. User authentication events