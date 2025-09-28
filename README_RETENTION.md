# Data Retention System

## Overview
Automated data retention and cleanup system for compliance with Canadian privacy laws (PIPEDA) and business requirements.

## Files Created
- `server/routes/internal.retention.run.mjs` - Retention job endpoint

## Usage

### Manual Run (Dry Mode)
```bash
# Test what would be deleted
POST /internal/retention/run?dry=1

# Response
{
  "ok": true,
  "summary": {
    "email_logs_deleted": 0,
    "transcripts_deleted": 0, 
    "recordings_deleted": 0,
    "dry_run": true
  },
  "retention_policies": {
    "email_logs_days": 90,
    "transcripts_days": 365,
    "recordings_days": 30
  }
}
```

### Production Run
```bash
# Actually delete old data
POST /internal/retention/run
```

## Retention Policies
- **Email logs**: 90 days (hard delete)
- **Transcripts**: 365 days (soft delete/redaction)
- **Twilio recordings**: 30 days (API deletion)

## Cron Schedule
Recommended: Weekly execution
```bash
# Monday 7:05 AM Mountain Time
5 7 * * 1 curl -X POST https://your-domain/internal/retention/run
```

## Implementation Notes
- Start with dry-run testing
- Monitor logs for errors
- Verify compliance with local data laws
- Consider org-specific retention policies