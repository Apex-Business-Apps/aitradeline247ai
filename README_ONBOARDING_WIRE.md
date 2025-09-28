# Onboarding System Wiring Guide

## Overview
The onboarding system provides self-service subscription signup and organization management through integrated Stripe billing and Supabase data storage.

## Integration Steps

### 1. Wire into Main Server
Add to your main server file (e.g., `server.mjs` or `app.js`):

```javascript
import { wireOnboarding } from './server/boot/onboarding.wire.mjs';

// After creating your Express app
const app = express();

// Wire onboarding routes
wireOnboarding(app);

// Start server
app.listen(port);
```

### 2. Environment Variables
Ensure these environment variables are configured:

```bash
# Stripe (required)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENT=price_...

# Application (required)
BASE_URL=https://www.tradeline247ai.com

# Supabase (required)
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Twilio (for test calls)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15005550006
```

### 3. Stripe Webhook Configuration
Configure Stripe webhook endpoint in your Stripe dashboard:

**Endpoint URL:** `https://yourdomain.com/webhooks/stripe/subs`

**Events to Send:**
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`

### 4. Frontend Route Integration
Add routes to your React Router configuration:

```tsx
import { Routes, Route } from 'react-router-dom';
import Pricing from '@/pages/Pricing';
import Subscribe from '@/routes/subscribe';
import Settings from '@/routes/settings';

function App() {
  return (
    <Routes>
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/subscribe" element={<Subscribe />} />
      <Route path="/settings" element={<Settings />} />
      {/* other routes */}
    </Routes>
  );
}
```

## API Endpoints Mounted

### Billing Endpoints
- `POST /api/billing/checkout` - Create Stripe Checkout session
- `POST /api/billing/portal` - Create Stripe Billing Portal session

### Settings Endpoints  
- `GET /api/settings?email_to=...` - Get organization settings
- `POST /api/settings` - Update organization settings
- `POST /api/settings/test-call` - Place test call

### Webhook Endpoints
- `POST /webhooks/stripe/subs` - Stripe subscription webhooks

## Database Dependencies

The onboarding system requires these Supabase tables:
- `orgs` - Organization information
- `subscriptions` - Stripe subscription data
- `org_settings` - Business configuration

These are created by the migration: `2025-09-28_onboarding_billing.sql`

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Service role has full access for server operations
- No direct client access to billing data

### Input Validation
- Phone numbers validated for NANP format
- Email addresses validated client and server-side
- Stripe webhook signatures verified

### API Security
- No authentication required (internal admin tool)
- Add authentication in production before public use
- Rate limiting recommended for production

## Testing

### Smoke Tests
```bash
# Test billing checkout
curl -X POST http://localhost:8080/api/billing/checkout \\\
  -H "Content-Type: application/json" \\\
  -d '{"name":"Test","email_to":"test@example.com","target_e164":"+15551234567","plan":"basic"}'

# Test settings retrieval  
curl "http://localhost:8080/api/settings?email_to=test@example.com"

# Test call placement
curl -X POST http://localhost:8080/api/settings/test-call \\\
  -H "Content-Type: application/json" \\\
  -d '{"email_to":"test@example.com"}'
```

### Stripe Test Mode
- Use test API keys for development
- Test webhook with Stripe CLI: `stripe listen --forward-to localhost:8080/webhooks/stripe/subs`
- Use test card numbers: `4242424242424242`

## Monitoring

### Logs to Monitor
- Stripe webhook processing success/failure
- Database connection errors
- Twilio API call results
- Invalid phone number submissions

### Key Metrics
- Subscription conversion rate
- Test call success rate
- Settings update frequency
- Webhook processing latency

## Troubleshooting

### Common Issues

**Stripe Webhook Verification Fails**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Ensure webhook endpoint uses raw body (`express.raw()`)\
- Check webhook endpoint URL in Stripe dashboard

**Phone Number Validation Errors**
- Only NANP numbers supported (`+1XXXXXXXXXX`)
- Check E.164 format validation in both client and server
- Verify test numbers work: `+15005550006`

**Database Connection Issues**
- Verify Supabase service role key has correct permissions
- Check RLS policies allow service role access
- Ensure tables exist (run migration)

**Test Call Failures**
- Verify Twilio credentials and phone number
- Check target phone number is valid and reachable
- Ensure Twilio account has sufficient balance

### Debug Mode
Enable detailed logging by setting:
```bash
DEBUG=onboarding:*
NODE_ENV=development
```

## Production Checklist

- [ ] Switch to Stripe live keys
- [ ] Configure production webhook endpoints
- [ ] Enable authentication on settings endpoints
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Test full signup → billing → settings flow
- [ ] Verify webhook signature validation
- [ ] Test phone number validation edge cases
- [ ] Confirm email delivery for notifications
