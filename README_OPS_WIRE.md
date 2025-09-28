# Unified Operations Wiring

Single import to wire all TradeLine 24/7 operational routes including enhancements, monitoring, and CTA pages.

## Usage

In your main server file, replace individual wiring calls:

### Before
```javascript
import { wireEnhancements } from './server/boot/enhancements.wire.mjs';
import { wireStatus } from './server/boot/status.wire.mjs';
import { alertTestHandler } from './server/routes/webhooks.alert.test.mjs';
import { ctaCallbackPageHandler, ctaDepositSuccessPageHandler } from './server/routes/cta.pages.mjs';

wireEnhancements(app);
wireStatus(app);
app.post('/internal/alert/test', alertTestHandler);
app.get('/cta/callback', ctaCallbackPageHandler);
app.get('/cta/deposit/success', ctaDepositSuccessPageHandler);
```

### After  
```javascript
import { wireOps } from './server/boot/ops.wire.mjs';
await wireOps(app);
```

## What Gets Wired

### Enhancement Routes (via wireEnhancements)
- Email CTA endpoints (`/a/c`, `/a/r`)
- Voice callback (`/voice/callback/connect`)
- Payment endpoints (`/api/payments/*`)
- Stripe webhooks (`/webhooks/stripe`)
- Internal digest (`/internal/digest/run`)

### Status Routes (via wireStatus)
- System status (`/status.json`)
- Version info (`/version`)

### Alert Routes
- Alert testing (`POST /internal/alert/test`)

### CTA Landing Pages
- Callback page (`/cta/callback`)
- Deposit success page (`/cta/deposit/success`)

## Integration Example

Complete server setup:
```javascript
import express from 'express';
import { wireOps } from './server/boot/ops.wire.mjs';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Wire all operational routes
await wireOps(app);

// Static file serving
app.use(express.static('public'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TradeLine 24/7 server running on port ${PORT}`);
});
```

## Error Handling

The wiring function:
- Catches and logs any import/wiring errors
- Throws errors to fail fast if critical routes can't be mounted
- Provides clear console feedback on success/failure

## Benefits

- **Single import**: Simplifies server configuration
- **Maintainable**: Easy to add new operational modules
- **Error handling**: Fails fast if routes can't be mounted
- **Async support**: Handles dynamic imports properly
- **Complete ops stack**: All monitoring, alerts, and CTA functionality

## Dependencies

The function dynamically imports:
- `./enhancements.wire.mjs` - Email CTAs, payments, webhooks, digest
- `./status.wire.mjs` - Status and version endpoints
- `../routes/webhooks.alert.test.mjs` - Alert testing
- `../routes/cta.pages.mjs` - GA4 tracking pages