# Runtime Feature Flags

Control TradeLine 24/7 enhancements without redeployment using environment variables.

## Environment Variables

### ENHANCEMENTS_ENABLED
Controls all enhancement features (email CTAs, callbacks, resolve actions).

```bash
ENHANCEMENTS_ENABLED=true   # Default: enabled
ENHANCEMENTS_ENABLED=false  # Disable all enhancements
```

### DEPOSIT_CTA_ENABLED
Controls Stripe deposit CTA buttons in missed call emails.

```bash
DEPOSIT_CTA_ENABLED=true   # Default: enabled
DEPOSIT_CTA_ENABLED=false  # Hide deposit buttons
```

## Usage Examples

### Full Enhancement Mode (Default)
```bash
ENHANCEMENTS_ENABLED=true
DEPOSIT_CTA_ENABLED=true
```

### Core Email Only (Backout Mode)
```bash
ENHANCEMENTS_ENABLED=false
DEPOSIT_CTA_ENABLED=false
```

### Enhanced but No Payments
```bash
ENHANCEMENTS_ENABLED=true
DEPOSIT_CTA_ENABLED=false
```

## Backout Strategy

To quickly disable enhancements in production:

1. Set environment variables:
   ```bash
   ENHANCEMENTS_ENABLED=false
   DEPOSIT_CTA_ENABLED=false
   ```

2. Restart application or purge cache

3. Core missed call emails will still be sent, but without CTA buttons

## Integration

Flags are imported in email templates:

```javascript
import { FLAGS } from './flags.mjs';

// CTA buttons only render if FLAGS.ENHANCEMENTS_ENABLED is true
// Deposit buttons only render if FLAGS.DEPOSIT_CTA_ENABLED is true
```

## Notes

- Changes take effect immediately on restart
- Core email functionality always works regardless of flag state
- Flags default to `true` for backward compatibility
- Use `false` string value to disable (environment variables are strings)