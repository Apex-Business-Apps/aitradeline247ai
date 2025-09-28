# Synthetic Monitoring & Cron Schedule

Recommended cron schedules for synthetic monitoring and automated operations for TradeLine 24/7.

## Suggested Edge Cron Schedule (America/Edmonton)

### Weekly Operations
```cron
# Monday 07:05 AM - Weekly digest email
5 7 * * 1
```
**Endpoint**: `POST /internal/digest/run`
**Purpose**: Generate and send weekly metrics summary to operations team

### System Health Monitoring
```cron
# Every 30 minutes - System status check
*/30 * * * *
```
**Endpoint**: `GET /status.json`
**Purpose**: Monitor system health, dependencies, and version info

```cron
# Every 15 minutes - Application health check
*/15 * * * *
```
**Endpoint**: `GET /healthz`
**Purpose**: Basic application liveness check

### Additional Monitoring Endpoints
```cron
# Every hour - Readiness check
0 * * * *
```
**Endpoint**: `GET /readyz`
**Purpose**: Application readiness and dependency status

## Implementation Options

### 1. External Cron Service (Recommended)
Use services like:
- **Cron-job.org** - Free web-based cron service
- **UptimeRobot** - HTTP monitoring with scheduling
- **GitHub Actions** - Scheduled workflows
- **Render Cron Jobs** - If hosting on Render

### 2. Supabase pg_cron (Database-level)
If using Supabase, enable `pg_cron` extension:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly digest
SELECT cron.schedule(
  'weekly-digest-monday',
  '5 7 * * 1',  -- Monday 7:05 AM
  $$
  SELECT net.http_post(
    url := 'https://your-domain.com/internal/digest/run',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule system health checks
SELECT cron.schedule(
  'system-status-check',
  '*/30 * * * *',  -- Every 30 minutes
  $$
  SELECT net.http_get(
    url := 'https://your-domain.com/status.json'
  ) AS request_id;
  $$
);

-- Schedule health checks
SELECT cron.schedule(
  'health-check',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT net.http_get(
    url := 'https://your-domain.com/healthz'
  ) AS request_id;
  $$
);
```

### 3. GitHub Actions (CI/CD Integration)
```yaml
# .github/workflows/synthetic-checks.yml
name: Synthetic Monitoring

on:
  schedule:
    # Monday 7:05 AM Edmonton (UTC-7/UTC-6)
    - cron: '5 14 * * 1'  # UTC time
    # Every 30 minutes for status
    - cron: '*/30 * * * *'

jobs:
  synthetic-check:
    runs-on: ubuntu-latest
    steps:
      - name: Weekly Digest
        if: github.event.schedule == '5 14 * * 1'
        run: |
          curl -X POST https://your-domain.com/internal/digest/run
          
      - name: Status Check
        if: github.event.schedule == '*/30 * * * *'
        run: |
          curl https://your-domain.com/status.json
          curl https://your-domain.com/healthz
```

## Alerting Requirements

### Success Criteria
- **2xx HTTP response codes** required for all endpoints
- **Response time** < 5000ms for most endpoints
- **Weekly digest** should return `{"ok": true, "sent": true}`

### Failure Alerting
- **≥2 consecutive failures** should trigger alerts
- **Critical endpoints** (`/healthz`, `/status.json`) - immediate alert
- **Operations endpoints** (`/internal/digest/run`) - alert after 2 failures

### Alert Channels
- Email to operations team (`info@tradeline247ai.com`)
- Slack/Discord webhooks (if configured)
- PagerDuty for critical issues

## Endpoint Characteristics

### Idempotent Endpoints
All monitoring endpoints are safe to call repeatedly:
- `/healthz` - Always safe, no side effects
- `/readyz` - Always safe, dependency checks
- `/status.json` - Always safe, returns current state
- `/internal/digest/run` - Idempotent, safe to re-run

### Expected Response Times
- `/healthz`: < 100ms
- `/readyz`: < 500ms  
- `/status.json`: < 300ms
- `/internal/digest/run`: < 10000ms (includes email sending)

## Timezone Considerations

**America/Edmonton** observes:
- **MST** (UTC-7) - November to March
- **MDT** (UTC-6) - March to November

Adjust cron times for daylight saving changes or use a timezone-aware scheduler.

## Monitoring Best Practices

1. **Gradual rollout**: Start with longer intervals, reduce as confidence grows
2. **Rate limiting**: Respect endpoint rate limits (60/min currently)
3. **Timeout handling**: Set reasonable timeouts (30s for most endpoints)
4. **Retry logic**: Retry failed requests with exponential backoff
5. **Logging**: Log all synthetic check results for trend analysis

## Implementation Checklist

- [ ] Choose cron service provider
- [ ] Configure weekly digest schedule (Monday 7:05 AM Edmonton)
- [ ] Set up health check monitoring (every 15-30 minutes)
- [ ] Configure alerting for failures
- [ ] Test all endpoints manually
- [ ] Verify timezone handling
- [ ] Set up logging/metrics collection
- [ ] Document escalation procedures