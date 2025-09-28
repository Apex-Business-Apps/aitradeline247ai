# Smoke Tests for TradeLine 24/7

Fast production validation script to verify core system functionality.

## Usage

### Basic smoke test
```bash
bash scripts/smokes.sh
```

### Custom host
```bash
bash scripts/smokes.sh https://staging.tradeline247ai.com
```

## What Gets Tested

### Core Health
- `/healthz` - Basic liveness check
- `/status.json` - Detailed system status with dependencies
- `/version` - Build and deployment info

### SEO Infrastructure  
- `/robots.txt` - Search engine crawling rules
- `/sitemap.xml` - Site structure for indexing

## Expected Results

All tests should return:
- HTTP 200 status codes
- Valid response content
- JSON structure validation where applicable

## Sample Output

```
🔥 Running smoke tests against: https://www.tradeline247ai.com
================================================
Testing /healthz... ✅ healthz
Testing /status.json... ✅ status  
Testing /version... ✅ version
Testing /robots.txt... ✅ robots
Testing /sitemap.xml... ✅ sitemap
================================================
🎉 All smoke tests passed!
```

## Extending for Production

### Add webhook tests when tokens available:
```bash
# Test alert system
curl -X POST "$HOST/internal/alert/test"

# Test CTA endpoints (expect 403 for invalid tokens)
curl "$HOST/a/r?t=invalid"
curl "$HOST/a/c?t=invalid"

# Test Stripe webhook (allow 200 even with invalid signature in dev)
curl -X POST "$HOST/webhooks/stripe" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

### CI/CD Integration
```yaml
# Add to GitHub Actions
- name: Run smoke tests
  run: bash scripts/smokes.sh ${{ env.PRODUCTION_URL }}
```

## Requirements

- `curl` - HTTP client
- `jq` - JSON processor
- `bash` - Shell environment

## Error Handling

Script uses `set -e` to fail fast on any endpoint failure. This ensures:
- Clear failure reporting
- Immediate CI/CD build failures
- No false positives in monitoring

## Monitoring Integration

Use in cron jobs for continuous monitoring:
```bash
# Every 5 minutes
*/5 * * * * cd /path/to/project && bash scripts/smokes.sh || alert_on_failure
```