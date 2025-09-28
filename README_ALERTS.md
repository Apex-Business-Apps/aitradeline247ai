# TradeLine 24/7 Alerting System

Minimal email-based alerting for critical system failures without third-party SDKs.

## Environment Variables

### Required
```bash
RESEND_API_KEY=re_...          # Resend API key for sending alerts
EMAIL_FROM=TradeLine 24/7 <noreply@tradeline247ai.com>
```

### Optional
```bash
EXEC_TO=info@tradeline247ai.com  # Alert recipient (default: info@tradeline247ai.com)
```

## Usage

### Send Alert
```javascript
import { alert } from './server/lib/alert.mjs';

await alert('Payment Processing Failed', {
  callSid: 'CA123...',
  error: 'Stripe signature verification failed',
  timestamp: Date.now()
});
```

### Test Endpoint
```bash
curl -X POST https://your-domain.com/internal/alert/test
```

## Integration Points

The alert system is integrated at key failure points:

### Stripe Webhooks
- Signature verification failures
- Unhandled event types
- Processing errors

### Email Processing
- Failed email sends after 3 attempts
- Template rendering errors
- SMTP failures

### Twilio Validation
- Signature validation spikes
- Webhook processing failures

## External Monitoring

For comprehensive monitoring, set up external cron jobs:

### Status Monitoring
```bash
# Every 30 seconds
*/30 * * * * curl -f https://your-domain.com/status.json || alert_external

# Every 15 seconds  
*/15 * * * * curl -f https://your-domain.com/healthz || alert_external
```

### Alert Trigger Rules
- 2 consecutive `/status.json` failures → Critical alert
- 2 consecutive `/healthz` failures → Service down alert
- Response time > 5s → Performance alert

## Alert Format

All alerts include:
- `[TL247 Alert]` subject prefix
- Timestamp in ISO format
- Structured JSON details
- Plain text fallback
- Automated source attribution

## Testing

Verify alert delivery:
```bash
# Test alert endpoint
curl -X POST https://your-domain.com/internal/alert/test

# Check executive email for delivery
```

## Notes

- Alerts are non-blocking (won't break main application flow)
- Uses existing Resend infrastructure
- HTML and text versions for compatibility
- Executive email configurable via `EXEC_TO` environment variable