# Status & Version Endpoints

These endpoints provide operational monitoring capabilities for the TradeLine 24/7 system.

## Endpoints

### Status Check
- `GET /status.json` - Returns comprehensive system status

### Version Check  
- `GET /version` - Returns plain text version info

## Environment Variables

### Optional (for deployment info)
```
GIT_SHA=abc123def456    # Git commit SHA
BUILT_AT=2025-01-15T10:30:00Z  # Build timestamp
RENDER_REGION=oregon    # Deployment region
```

## Example Usage

### Status check
```bash
curl https://your-domain.com/status.json
```

Response:
```json
{
  "ok": true,
  "ts": "2025-01-15T10:30:00.000Z",
  "region": "oregon",
  "deps": {
    "supabase": true
  },
  "version": {
    "gitSha": "abc123def456",
    "builtAt": "2025-01-15T10:30:00Z"
  }
}
```

### Version check
```bash
curl https://your-domain.com/version
```

Response:
```
abc123def456 2025-01-15T10:30:00Z
```

## Rate Limiting

Both endpoints are rate-limited to 60 requests per minute to prevent abuse while allowing monitoring systems to check frequently.

## Integration

Wire up in your main server file:
```js
import { wireStatus } from './server/boot/status.wire.mjs';
wireStatus(app);
```