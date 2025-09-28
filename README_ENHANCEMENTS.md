# TradeLine 24/7 Enhancements

This document covers the email CTA, Stripe payments, and weekly digest enhancements added to the TradeLine 24/7 system.

## Integration

Wire up the enhancements in your main server file:

```js
import { wireEnhancements } from './server/boot/enhancements.wire.mjs';
wireEnhancements(app);
```

## Required Environment Variables

### Core Email CTAs
```
RESEND_API_KEY=re_...
EMAIL_FROM=TradeLine 24/7 <noreply@tradeline247ai.com>
REPLY_TO=info@tradeline247ai.com
EMAIL_SIGNING_SECRET=your-256-bit-secret
BASE_URL=https://your-domain.com
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
BUSINESS_TARGET_E164=+14319900222
```

### Optional Stripe Integration
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAY_DEPOSIT_AMOUNT_CAD=25
```

### Weekly Digest
```
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
TIMEZONE=America/Edmonton
```

## Endpoints

### Email CTAs
- `GET /a/c?t=<token>` - Initiate callback to original caller
- `GET /a/r?t=<token>` - Mark call as resolved

### Voice
- `GET|POST /voice/callback/connect?to=<e164>` - TwiML to connect calls

### Payments
- `POST /api/payments/create-checkout` - Create Stripe checkout session
- `POST /webhooks/stripe` - Handle Stripe webhook events

### Operations
- `POST /internal/digest/run` - Generate and send weekly digest

## Example cURL Commands

### Test callback CTA
```bash
curl "https://your-domain.com/a/c?t=valid-token"
```

### Test resolve CTA
```bash
curl "https://your-domain.com/a/r?t=valid-token"
```

### Create checkout session
```bash
curl -X POST https://your-domain.com/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"callSid":"CA_test","e164":"+17805551212"}'
```

### Generate weekly digest
```bash
curl -X POST https://your-domain.com/internal/digest/run
```

## Features

### Email CTAs
- One-click callback: Initiates call from business to original caller
- Mark resolved: Updates call status in database
- 7-day token expiration for security
- Idempotent operations

### Stripe Payments
- Booking deposit collection ($25 CAD default)
- Webhook-driven status updates
- Integration with missed call emails
- Only shown to users without recent successful payments

### Weekly Digest
- Automated metrics collection
- Top missed numbers analysis
- Recent transcript summaries
- Email delivery to operations team

All endpoints are rate-limited and idempotent for production safety.