# Stripe Billing Webhooks

Complete guide for hardened Stripe webhook processing with idempotency, signature verification, and replay capabilities.

## Architecture

```
Stripe → POST /stripe-webhook → Verify Signature → Store Event → ACK (200ms) → Background Process
```

### Key Features

1. **Signature Verification**: Every webhook validated with `STRIPE_WEBHOOK_SECRET`
2. **Idempotent Storage**: Duplicate events ignored via unique `event_id` constraint
3. **Fast ACK**: < 200ms response to Stripe (prevents timeouts)
4. **Background Processing**: Heavy work queued after ACK
5. **Replay Support**: Manual and CLI-based event replay

## Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...          # Stripe API key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signing secret

# Supabase (auto-provided)
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Get Webhook Secret

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. URL: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for (see Event Types below)
5. Copy the "Signing secret" (starts with `whsec_`)

## Stripe Dashboard Configuration

### Create Webhook Endpoint

1. Navigate to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/stripe-webhook
   ```
4. Select API version: Latest (2024-11-20.acacia)
5. **Select events to listen to**:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
   - `charge.dispute.created`

6. Click **Add endpoint**
7. **Copy the Signing Secret** and add to Supabase secrets

### Add Signing Secret to Supabase

```bash
# Via Supabase CLI
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Or via Dashboard
# https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/settings/functions
```

## Idempotency Strategy

### Event Storage

Every webhook event is stored in `billing_events` with a unique `event_id`:

```sql
-- Unique constraint prevents duplicate processing
CREATE UNIQUE INDEX idx_billing_events_event_id ON billing_events(event_id);
```

### Processing States

| Status | Meaning |
|--------|---------|
| `pending` | Event received, awaiting processing |
| `processing` | Currently being processed |
| `processed` | Successfully completed |
| `failed` | Processing failed (see `error_message`) |

### Idempotent API Calls

Use helpers from `_shared/stripeIdempotency.ts`:

```typescript
import { 
  createStripeClient,
  generateIdempotencyKey,
  createCheckoutSessionIdempotent
} from "../_shared/stripeIdempotency.ts";

// Generate idempotency key from request
const idempotencyKey = generateIdempotencyKey(req, "create_checkout");

// Create checkout session (safe to retry)
const session = await createCheckoutSessionIdempotent(
  stripe,
  idempotencyKey,
  {
    customer: customerId,
    line_items: [...],
    mode: "payment",
    success_url: "...",
    cancel_url: "..."
  }
);
```

### Retry Safety

- **Duplicate webhook delivery**: Returns 200 without reprocessing
- **Network failures**: Stripe auto-retries with same `event_id`
- **API failures**: Idempotency keys prevent duplicate charges
- **Manual replay**: Updates `processing_status` safely

## Event Processing Flow

### 1. Receive Webhook (< 200ms)

```typescript
// Verify signature
const validation = verifyStripeWebhook(payload, signature, secret);
if (!validation.valid) {
  return 400; // Invalid signature
}

// Store event (idempotent)
await supabase.from("billing_events").insert({
  event_id: event.id,
  event_type: event.type,
  payload: event,
  processing_status: "pending"
});

// Fast ACK
return 200;
```

### 2. Background Processing

```typescript
// Mark as processing
UPDATE billing_events 
SET processing_status = 'processing', 
    last_processed_at = now()
WHERE event_id = :event_id;

// Process based on event type
switch (event.type) {
  case "invoice.payment_succeeded":
    await handleInvoicePaymentSucceeded(event);
    break;
  // ... other handlers
}

// Mark as processed
UPDATE billing_events 
SET processing_status = 'processed'
WHERE event_id = :event_id;
```

## Event Types & Handlers

### Invoice Events

- **invoice.payment_succeeded**: Update `billing_invoices`, mark as paid
- **invoice.payment_failed**: Update invoice status, trigger retry logic

### Payment Intent Events

- **payment_intent.succeeded**: Record in `billing_payments`
- **payment_intent.payment_failed**: Mark as failed, alert user

### Subscription Events

- **customer.subscription.created**: Provision access
- **customer.subscription.updated**: Update plan/limits
- **customer.subscription.deleted**: Revoke access (with grace period)

### Dispute/Refund Events

- **charge.refunded**: Record refund, adjust balances
- **charge.dispute.created**: Alert team, freeze account if needed

## Manual Replay

### Via Stripe CLI

Install [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Replay single event
stripe events resend evt_1AbCdE2FgHiJkLmN

# Replay to local endpoint (testing)
stripe events resend evt_1AbCdE2FgHiJkLmN \
  --webhook-endpoint https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/stripe-webhook
```

### Via Stripe Dashboard

1. Go to **Developers → Events**
2. Find the event (search by ID or filter by type)
3. Click on the event
4. Click **Send test webhook**
5. Select your endpoint
6. Click **Send test webhook**

### Via Database (Advanced)

Reset event status to trigger reprocessing:

```sql
-- Mark event for reprocessing
UPDATE billing_events 
SET processing_status = 'pending',
    retry_count = 0,
    error_message = NULL
WHERE event_id = 'evt_1AbCdE2FgHiJkLmN';

-- Or delete and let Stripe resend
DELETE FROM billing_events 
WHERE event_id = 'evt_1AbCdE2FgHiJkLmN';
```

## Monitoring & Debugging

### Check Event Status

```sql
-- View recent events
SELECT 
  event_id,
  event_type,
  processing_status,
  received_at,
  last_processed_at,
  retry_count,
  error_message
FROM billing_events
ORDER BY received_at DESC
LIMIT 50;

-- Check failed events
SELECT * FROM billing_events 
WHERE processing_status = 'failed'
ORDER BY received_at DESC;

-- Count by status
SELECT 
  processing_status, 
  COUNT(*) as count,
  MAX(received_at) as last_event
FROM billing_events
GROUP BY processing_status;
```

### Edge Function Logs

View logs in Supabase Dashboard:
- [stripe-webhook logs](https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/functions/stripe-webhook/logs)

Or via CLI:
```bash
supabase functions logs stripe-webhook --tail
```

### Stripe Dashboard Logs

1. Go to **Developers → Webhooks**
2. Click on your endpoint
3. View **Recent deliveries**
4. Check response codes and timing

## Rollback Strategy

### Scenario 1: Webhook Processing Bug

1. **Stop new processing**:
   ```sql
   -- Mark all pending as failed
   UPDATE billing_events 
   SET processing_status = 'failed',
       error_message = 'Paused for maintenance'
   WHERE processing_status = 'pending';
   ```

2. **Deploy fix**

3. **Replay failed events**:
   ```sql
   -- Reset to pending
   UPDATE billing_events 
   SET processing_status = 'pending',
       retry_count = 0,
       error_message = NULL
   WHERE processing_status = 'failed'
   AND error_message = 'Paused for maintenance';
   ```

### Scenario 2: Double Charge (Idempotency Failed)

1. **Identify duplicate**:
   ```sql
   SELECT * FROM billing_payments
   WHERE stripe_customer_id = 'cus_...'
   ORDER BY created_at DESC;
   ```

2. **Refund via Stripe**:
   ```bash
   stripe refunds create --payment-intent pi_...
   ```

3. **Update records**:
   ```sql
   UPDATE billing_payments
   SET status = 'refunded',
       metadata = jsonb_set(metadata, '{refund_reason}', '\"duplicate_charge\"')
   WHERE stripe_payment_intent_id = 'pi_...';
   ```

### Scenario 3: Webhook Endpoint Down

Stripe automatically retries for 3 days:
- Immediate retry
- 1 hour later
- Then every 6 hours for 3 days

Once back online:
1. Check for missed events in Stripe Dashboard
2. Manually replay if needed
3. Verify all critical events processed

## Testing

### Local Testing with Stripe CLI

```bash
# Forward webhooks to local Edge Function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.created
```

### Test Signature Verification

```bash
# Valid signature (should return 200)
curl -X POST http://localhost:54321/functions/v1/stripe-webhook \
  -H "Stripe-Signature: valid_sig" \
  -d @test_event.json

# Invalid signature (should return 400)
curl -X POST http://localhost:54321/functions/v1/stripe-webhook \
  -H "Stripe-Signature: invalid_sig" \
  -d @test_event.json
```

### Test Idempotency

```bash
# Send same event twice
EVENT_ID="evt_test_$(date +%s)"

for i in {1..2}; do
  curl -X POST http://localhost:54321/functions/v1/stripe-webhook \
    -H "Stripe-Signature: $STRIPE_SIG" \
    -d "{\"id\": \"$EVENT_ID\", \"type\": \"payment_intent.succeeded\", ...}"
done

# Check database - should only have 1 record
psql -c "SELECT COUNT(*) FROM billing_events WHERE event_id = '$EVENT_ID';"
```

## Security Best Practices

1. **Always verify signatures**: Never process webhooks without verification
2. **Use HTTPS only**: Webhook endpoint must be HTTPS
3. **Rotate secrets**: Change `STRIPE_WEBHOOK_SECRET` if compromised
4. **Monitor failed events**: Set up alerts for repeated failures
5. **Rate limit**: Edge function automatically rate-limits by IP
6. **Audit logs**: All events logged with request IDs

## Troubleshooting

### Webhook Not Receiving Events

1. Check endpoint URL in Stripe Dashboard
2. Verify HTTPS and endpoint is accessible
3. Check Supabase Edge Function logs for errors
4. Ensure `STRIPE_WEBHOOK_SECRET` is set correctly

### Signature Verification Failing

1. Copy fresh signing secret from Stripe Dashboard
2. Update Supabase secret: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
3. Redeploy Edge Function
4. Test with Stripe CLI

### Events Not Processing

1. Check `billing_events` table for failed events
2. Review `error_message` column
3. Check Edge Function logs
4. Manually retry failed events

### Duplicate Charges

1. Should not happen with idempotency keys
2. If it does, check `billing_events` for duplicate `event_id`
3. Refund duplicate via Stripe Dashboard
4. File bug report with idempotency key and request ID

## Related Documentation

- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe API Idempotency](https://stripe.com/docs/api/idempotent_requests)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Support

- Stripe Support: https://support.stripe.com
- Edge Function Logs: https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/functions/stripe-webhook/logs
- Database Issues: Check `billing_events` table for failed events

