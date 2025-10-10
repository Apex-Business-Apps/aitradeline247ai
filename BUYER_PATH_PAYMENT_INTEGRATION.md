# Buyer Path Payment Integration Guide

## Status: Signup trigger ✅ | Payment trigger ⏳

The buyer path automation is now configured for **after_signup** emails. When you implement Stripe billing webhooks, add the **after_payment** trigger following these instructions:

---

## Payment Trigger Implementation

### In your Stripe webhook handler (e.g., `supabase/functions/billing-webhooks/index.ts`):

When you detect a subscription became active for a user (event: `customer.subscription.created` or `customer.subscription.updated` with `status=active`), add this server-side call:

```typescript
// Inside your webhook handler after successful subscription activation
const userId = /* extract user_id from Stripe customer metadata */;

await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/automation-buyer-path`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json', 
    'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` 
  },
  body: JSON.stringify({ 
    event_type: 'after_payment', 
    user_id: userId 
  })
});
```

### Key Points:
- Only triggers when `subscription_status` becomes `'active'` in the profiles table
- Idempotency enforced by `buyer_path_sends` table (one email per user per event_type)
- Safe to retry - duplicate calls return 200 without re-sending

---

## What's Already Working

✅ **Email template**: `emails/buyer-path.html`  
✅ **DB table**: `buyer_path_sends` (tracks sent emails, prevents duplicates)  
✅ **Edge function**: `automation-buyer-path` (validates, sends, logs)  
✅ **Signup trigger**: `src/pages/Auth.tsx` (calls function after account creation)  
⏳ **Payment trigger**: Add to your billing webhook when ready

---

## Testing

### Signup Email (works now):
1. Create a new account
2. Email sends automatically if user has `trial_ends_at` in future
3. Check `buyer_path_sends` table for record

### Payment Email (requires billing webhook):
1. Complete first payment via Stripe
2. Webhook updates `profiles.subscription_status = 'active'`
3. Webhook calls `automation-buyer-path` with `event_type: 'after_payment'`
4. Email sends if not already sent

---

## Required Environment Variables

Ensure these are set in your Supabase project:
- `RESEND_API_KEY` - for sending emails
- `SUPABASE_URL` - auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` - auto-provided
