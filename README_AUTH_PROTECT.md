# Server Auth Protection

## Overview
Server-side JWT authentication protection for API routes using Supabase auth verification.

## Files Created
- `server/lib/auth.guard.mjs` - JWT verification middleware
- `server/boot/auth.protect.wire.mjs` - Route protection wiring

## Protected Routes
The following routes now require valid JWT authentication:
- `/api/settings` (all methods)
- `/api/settings/test-call` (all methods)  
- `/api/billing/portal` (all methods)

## Frontend Integration
Frontend must attach Supabase JWT when calling protected APIs:

```typescript
// Get session token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Attach to API calls
const response = await fetch('/api/settings', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## How It Works
1. Middleware extracts JWT from `Authorization: Bearer` header or `access_token` cookie
2. Verifies token with Supabase using `getUser(token)`
3. Sets `req.user = { id, email }` on success
4. Returns 401 if token is missing/invalid

## Security Notes
- Combine with RLS policies for defense in depth
- RLS ensures DB-level row access control even if route protection is bypassed
- JWT verification happens on every protected request