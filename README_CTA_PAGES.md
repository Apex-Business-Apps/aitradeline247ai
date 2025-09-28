# CTA Landing Pages with GA4 Tracking

Client-side GA4 event tracking for email CTA interactions on TradeLine 24/7.

## Endpoints

### Callback Page
- `GET /cta/callback` - Serves callback confirmation page with GA4 tracking

### Deposit Success Page  
- `GET /cta/deposit/success` - Serves payment success page with GA4 tracking

## GA4 Events

### Callback CTA Click
```javascript
window.gtag('event', 'cta_callback_click', {
  e164: '+17805551212',
  event_category: 'email_cta', 
  event_label: 'callback_initiated'
});
```

### Stripe Deposit Success
```javascript
window.gtag('event', 'stripe_deposit_success', {
  e164: '+17805551212',
  value: 25,
  currency: 'CAD',
  event_category: 'conversion',
  event_label: 'booking_deposit'
});
```

## URL Parameters

Both pages expect query parameters:

### Required
- `n` - E164 phone number (e.g., `+17805551212`)

### Optional (deposit page)
- `a` - Amount in CAD (e.g., `25`)

## Email Template Integration

To add client-side GA4 tracking to email CTAs, update button links to redirect through these pages:

### Current (server-only tracking)
```html
<a href="https://domain.com/a/c?t=token123">Call Me Back</a>
```

### Enhanced (client + server tracking)  
```html
<a href="https://domain.com/cta/callback?n=+17805551212&redirect=/a/c?t=token123">Call Me Back</a>
```

## Benefits

### Client-Side Tracking
- Captures user interactions even if server endpoint fails
- Provides real-time GA4 events for marketing analysis
- Works with ad platform conversion tracking

### Server-Side Backup
- Server endpoints still fire their own GA4 events
- Provides redundant conversion tracking
- Handles cases where client-side JS is blocked

## File Structure

```
public/
├── cta-callback.html          # Callback confirmation page
└── cta-deposit-success.html   # Payment success page

server/routes/
└── cta.pages.mjs             # Route handlers for CTA pages
```

## Usage Examples

### Test callback page
```bash
curl https://your-domain.com/cta/callback?n=+17805551212
```

### Test deposit success page
```bash
curl "https://your-domain.com/cta/deposit/success?n=+17805551212&a=25"
```

## Integration

Wire up CTA pages in your server:
```javascript
import { ctaCallbackPageHandler, ctaDepositSuccessPageHandler } from './server/routes/cta.pages.mjs';

app.get('/cta/callback', ctaCallbackPageHandler);
app.get('/cta/deposit/success', ctaDepositSuccessPageHandler);
```

## Notes

- Pages are cached with `no-cache` headers for real-time tracking
- GA4 events only fire if `window.gtag` is available
- Phone numbers should be URL-encoded in email templates
- Amount values are parsed as floats for GA4 value tracking