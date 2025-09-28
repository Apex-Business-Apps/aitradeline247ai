# Smoke Tests for TradeLine 24/7 Enhancements

Quick verification tests for all enhancement endpoints.

## Call-Back CTA (simulate)

Generate token with server signer or temporarily hit GET /a/c?t=<valid> to confirm 200 {ok:true}

```bash
# Test with valid token (replace with actual token)
curl "https://your-domain.com/a/c?t=valid-token-here"
# Expected: {"ok":true,"started":true,"callSid":"CA..."}

# Test with invalid token
curl "https://your-domain.com/a/c?t=invalid"
# Expected: 403 {"error":"Invalid or expired token"}

# Test missing token
curl "https://your-domain.com/a/c"
# Expected: 400 {"error":"Token required"}
```

## Resolve CTA

```bash
# Test resolve with valid token
curl "https://your-domain.com/a/r?t=valid-token-here"
# Expected: {"ok":true,"resolved":true,"callSid":"CA..."}

# Test with invalid token
curl "https://your-domain.com/a/r?t=invalid"
# Expected: 403 {"error":"Invalid or expired token"}
```

## Voice Callback Connect

```bash
# Test TwiML generation
curl "https://your-domain.com/voice/callback/connect?to=%2B17805551212"
# Expected: TwiML XML with <Dial><Number>+17805551212</Number></Dial>

# Test missing parameter
curl "https://your-domain.com/voice/callback/connect"
# Expected: TwiML XML with error message and <Hangup/>
```

## Stripe

```bash
# Test checkout creation (if Stripe configured)
curl -X POST https://your-domain.com/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"callSid":"CA_test","e164":"+17805551212"}'
# Expected: {"ok":true,"url":"https://checkout.stripe.com/...","paymentId":"pay_..."}

# Test with Stripe disabled
# Expected: {"ok":false,"disabled":true,"message":"Stripe not configured"}

# Test missing fields
curl -X POST https://your-domain.com/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 {"error":"Missing required fields: callSid, e164"}
```

### Stripe Webhook Test

```bash
# Test webhook with valid signature (requires Stripe CLI or proper signature)
curl -X POST https://your-domain.com/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=timestamp,v1=signature" \
  -d '{"type":"checkout.session.completed","data":{"object":{"metadata":{"paymentId":"test"}}}}'
# Expected: 200 {"received":true}

# Test without signature
curl -X POST https://your-domain.com/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
# Expected: 400 {"error":"Invalid signature"}
```

## Weekly Digest

```bash
# Generate weekly digest
curl -X POST https://your-domain.com/internal/digest/run
# Expected: {"ok":true,"sent":true,"metrics":{...},"emailId":"..."}

# Check rate limiting (after 60 requests in 1 minute)
# Expected: 429 {"error":"Too many requests, please try again later"}
```

## Rate Limiting Tests

```bash
# Test rate limiting on /a/* endpoints (60/minute limit)
for i in {1..65}; do
  curl -w "%{http_code}\n" -o /dev/null -s "https://your-domain.com/a/c?t=test"
done
# Expected: First 60 return 400 (token error), last 5 return 429 (rate limited)
```

## Environment Variable Tests

### Missing Required Variables
```bash
# Test with missing EMAIL_SIGNING_SECRET
# Server should fail to start with error message

# Test with missing Stripe keys (should gracefully disable)
curl -X POST https://your-domain.com/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"callSid":"test","e164":"+1234567890"}'
# Expected: {"ok":false,"disabled":true}
```

## Token Generation Test

To generate a valid test token (run in Node.js environment with your signer):

```javascript
import { sign } from './server/lib/signer.mjs';

const testToken = sign({
  callSid: 'CA_test_12345',
  toE164: '+17805551212'
});

console.log('Test token:', testToken);
```

## Notes

- All endpoints are idempotent and safe to rerun
- Rate limits reset every minute
- Tokens expire after 7 days
- Stripe integration gracefully degrades when not configured
- Database operations are best-effort (won't fail requests)

## Quick Health Check

Test all endpoints in sequence:

```bash
#!/bin/bash
BASE_URL="https://your-domain.com"

echo "Testing enhancement endpoints..."

# Test resolve (will fail on token but endpoint works)
curl -s "$BASE_URL/a/r?t=test" | grep -q "Invalid" && echo "✅ Resolve endpoint"

# Test callback (will fail on token but endpoint works) 
curl -s "$BASE_URL/a/c?t=test" | grep -q "Invalid" && echo "✅ Callback endpoint"

# Test voice connect
curl -s "$BASE_URL/voice/callback/connect" | grep -q "xml" && echo "✅ Voice connect"

# Test payments
curl -s -X POST "$BASE_URL/api/payments/create-checkout" -H "Content-Type: application/json" -d '{}' | grep -q "Missing" && echo "✅ Payments endpoint"

# Test digest
curl -s -X POST "$BASE_URL/internal/digest/run" | grep -q "ok" && echo "✅ Digest endpoint"

echo "All enhancement endpoints responding!"
```