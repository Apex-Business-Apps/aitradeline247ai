# GA4 Events for Email CTAs & Deposits

Google Analytics 4 event tracking for TradeLine 24/7 email interactions and payment conversions.

## Available Events

### Email Events
- `email_missed_sent` - Missed call email notification sent
- `cta_callback_click` - User clicked callback button in email  
- `cta_deposit_click` - User clicked deposit button in email
- `cta_resolve_click` - User clicked resolve button in email

### Conversion Events
- `stripe_deposit_success` - Successful Stripe payment completion
- `callback_initiated` - Callback call successfully started

## Usage

### In React Components

```tsx
import { useEmailMissedSent, onCallbackCtaClick, onDepositCtaClick } from '@/hooks/useGaEvents';

function EmailLandingPage() {
  // Auto-track if email was sent (checks window.__missedSent=1)
  useEmailMissedSent();
  
  const handleCallbackClick = () => {
    onCallbackCtaClick('+17805551234');
    // Proceed with callback logic
  };
  
  const handleDepositClick = () => {
    onDepositCtaClick('+17805551234', 25);
    // Proceed with Stripe checkout
  };
}
```

### In Email CTA Handlers

#### Callback CTA Success Page
When the callback email CTA successfully initiates a call:
```tsx
import { onCallbackSuccess } from '@/hooks/useGaEvents';

// After successful Twilio call creation
onCallbackSuccess(e164);
```

#### Stripe Success Page
When a deposit payment completes successfully:
```tsx
import { onStripeDepositSuccess } from '@/hooks/useGaEvents';

// After Stripe webhook confirms payment
onStripeDepositSuccess(e164, amountCAD);
```

#### Resolve CTA Page
When user clicks "Mark Resolved" button:
```tsx
import { onResolveCtaClick } from '@/hooks/useGaEvents';

// Before making resolve API call
onResolveCtaClick(e164);
```

## Email Integration

### Server-Side Email Rendering
Set the flag for tracking missed email sends:
```html
<!-- In email template -->
<script>window.__missedSent = 1;</script>
```

### Email CTA Links
Email buttons should link to pages that:
1. Call the appropriate tracking function
2. Perform the action (callback, deposit, resolve)
3. Show confirmation to user

Example email button destinations:
- **Callback**: `/email-cta/callback?t=<token>` → calls `onCallbackCtaClick()` → API call → success page
- **Deposit**: `/email-cta/deposit?t=<token>` → calls `onDepositCtaClick()` → Stripe checkout
- **Resolve**: `/email-cta/resolve?t=<token>` → calls `onResolveCtaClick()` → API call → confirmation

## Event Properties

All events include:
- `e164` - Phone number (when applicable)
- `event_category` - Event grouping (`email_cta`, `conversion`, `email`)
- `event_label` - Specific action description
- `value` & `currency` - For payment events (amount in CAD)

## Requirements

Ensure GA4 is loaded via gtag:
```html
<!-- GA4 tracking code in index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

The tracking functions will log warnings if GA4 is not available.