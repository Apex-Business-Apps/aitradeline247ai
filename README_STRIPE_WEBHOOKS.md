# Stripe Subscriptions Webhook

## Overview
Secure Stripe webhook handler for subscription lifecycle events (created/updated/deleted) with proper signature verification.

## Files Created
- `server/routes/webhooks.stripe.subs.mjs` - Subscription webhook handler

## Environment Variables Required
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Endpoint secret from Stripe dashboard
```

## Webhook Events Handled
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Status/plan changes  
- `customer.subscription.deleted` - Canceled subscription

## Raw Body Requirement
**CRITICAL**: Stripe signature verification requires the raw request body (before JSON parsing).

Ensure your Express middleware is configured:
```javascript
// Use raw body for Stripe webhooks
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

// Use JSON parsing for other routes  
app.use(express.json());
```

## Testing with Stripe CLI
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe/subs

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated  
stripe trigger customer.subscription.deleted
```

## Database Integration
Updates the `subscriptions` table with:
- Stripe subscription ID
- Customer ID
- Status (active/canceled/past_due)
- Plan name (from price nickname)
- Current period end date

## Error Handling
- Invalid signature → 400 response
- Processing errors → 500 response  
- Logs all webhook events and errors
- Graceful handling of unknown event types

## Security Notes
- Always verify webhook signatures
- Use endpoint-specific webhook secrets
- Monitor for replay attacks
- Log all webhook events for audit