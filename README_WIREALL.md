# Wire All Enhancements

Unified wiring module for all TradeLine 24/7 server enhancements.

## Usage

In your main server file, replace individual wiring calls with a single import:

### Before
```js
import { wireEnhancements } from './server/boot/enhancements.wire.mjs';
import { wireStatus } from './server/boot/status.wire.mjs';
wireEnhancements(app);
wireStatus(app);
```

### After  
```js
import { wireAll } from './server/boot/wire.all.mjs';
wireAll(app);
```

## What Gets Wired

The `wireAll()` function automatically wires:

### Enhancement Routes
- Email CTA endpoints (`/a/c`, `/a/r`)
- Voice callback endpoints (`/voice/callback/connect`)
- Payment endpoints (`/api/payments/*`)
- Stripe webhooks (`/webhooks/stripe`)
- Internal operations (`/internal/digest/run`)

### Status Routes
- System status (`/status.json`)
- Version info (`/version`)

## Error Handling

The wiring function:
- Catches and logs any import/wiring errors
- Throws errors to fail fast if critical routes can't be mounted
- Provides clear console feedback on success/failure

## Rate Limiting

All wired routes include appropriate rate limiting:
- Enhancement routes: 60 requests/minute
- Status routes: 60 requests/minute

## Dependencies

The function dynamically imports:
- `./enhancements.wire.mjs` - Email CTAs, payments, webhooks
- `./status.wire.mjs` - Status and version endpoints

## Integration Example

Complete server setup:
```js
import express from 'express';
import { wireAll } from './server/boot/wire.all.mjs';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Wire all enhancement routes
await wireAll(app);

// Health checks
app.get('/healthz', (_, res) => res.send('ok'));
app.get('/readyz', (_, res) => res.send('ready'));

// Start server
app.listen(5000);
```

## Benefits

- **Single import**: Simplifies server configuration
- **Maintainable**: Easy to add new enhancement modules
- **Error handling**: Fails fast if routes can't be mounted
- **Async support**: Handles dynamic imports properly