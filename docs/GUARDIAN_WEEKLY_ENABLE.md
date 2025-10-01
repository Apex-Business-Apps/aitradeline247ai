# Guardian Weekly — Enable

## Overview
The Guardian Weekly Report provides automated health monitoring of production endpoints.

## Configuration
- **Workflow**: `.github/workflows/guardian-weekly.yml`
- **Schedule**: Sunday 03:00 America/Edmonton (~09:00 UTC)
- **Output**: `docs/guardian/weekly/YYYY-MM-DD.md`

## Monitored Endpoints
- `/healthz` (liveness probe)
- `/readyz` (readiness probe)
- `/assets/brand/App_Icons/icon-192.png` (static asset check)
- `/download/release.tar.gz.sha256` (artifact verification)

## Hosts Checked
- `https://tradeline247ai.com`
- `https://www.tradeline247ai.com`

## Kill Switch
To disable the scheduled job:
1. Set `GUARDIAN_WEEKLY_ENABLED: "false"` in the workflow file
2. Push to main branch
3. Alternatively, remove the `schedule` block entirely

## Manual Trigger
Use GitHub Actions UI: Actions → Guardian Weekly Report → Run workflow
