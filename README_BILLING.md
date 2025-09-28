# Billing System Documentation

## Environment Variables Required

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs for each plan
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENT=price_...

# Application
BASE_URL=https://www.tradeline247ai.com

# Supabase (for data storage)
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## API Endpoints

### POST /api/billing/checkout
Create a Stripe Checkout session for subscription signup.

**Request Body:**
```json
{
  "name": "Business Name",
  "email_to": "contact@business.com", 
  "target_e164": "+15551234567",
  "plan": "basic|pro|enterprise"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "email_to": "test@example.com",
    "target_e164": "+15551234567", 
    "plan": "basic"
  }'
```

### POST /api/billing/portal
Create a Stripe Billing Portal session for subscription management.

**Request Body:**
```json
{
  "stripe_customer_id": "cus_..."
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

### POST /webhooks/stripe/subs
Stripe webhook endpoint for subscription events.

**Supported Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Headers Required:**
- `stripe-signature`: Webhook signature for verification

## Database Tables

### orgs
- `id` (uuid, primary key)
- `name` (text, business name)
- `email_to` (text, primary contact email, unique)
- `target_e164` (text, forwarding phone number)
- `created_at` (timestamptz)

### subscriptions
- `id` (uuid, primary key)
- `org_id` (uuid, foreign key to orgs)
- `stripe_customer_id` (text, Stripe customer ID)
- `stripe_subscription_id` (text, Stripe subscription ID)
- `plan` (text, basic|pro|enterprise)
- `status` (text, Stripe subscription status)
- `current_period_end` (timestamptz)
- `created_at` (timestamptz)

### org_settings
- `org_id` (uuid, primary key, foreign key to orgs)
- `business_name` (text, display name for AI)
- `email_recipients` (text[], notification emails)
- `business_target_e164` (text, forwarding phone)
- `updated_at` (timestamptz)

## Test Mode Notes

1. Use Stripe test keys (`sk_test_...`, `pk_test_...`)
2. Use test webhook endpoints for local development
3. Test phone numbers: `+15005550006` (valid test number)
4. Test emails should use `@example.com` domain

## Error Handling

- **400**: Invalid request (missing fields, invalid plan, bad phone format)
- **404**: Organization not found
- **500**: Internal server error (Stripe API failure, database error)

## Phone Number Validation

- Only NANP (North American) numbers supported: `+1XXXXXXXXXX`
- Format: `+1` followed by exactly 10 digits
- Examples: `+15551234567`, `+14161234567`

## Plan Mapping

| Plan Name | Stripe Price ID | Monthly Cost |
|-----------|----------------|--------------|
| basic     | STRIPE_PRICE_BASIC | $149 CAD |
| pro       | STRIPE_PRICE_PRO   | $299 CAD |
| enterprise| STRIPE_PRICE_ENT   | $599 CAD |