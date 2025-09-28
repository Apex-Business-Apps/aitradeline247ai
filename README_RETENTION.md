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
  "policies_processed": 1
}
```

### Production Run
```bash
# Actually delete old data
POST /internal/retention/run
```

## Retention Policies (per org)
- **Email logs**: 180 days (hard delete) 
- **Transcripts**: 90 days (soft delete/redaction)
- **Twilio recordings**: 30 days (API deletion)

## How It Works
1. Reads retention policies from `retention_policies` table
2. For each org, processes cleanup based on policy
3. Transcripts are soft-deleted (content → '[REDACTED - RETENTION POLICY]')
4. Twilio recordings deleted via REST API if credentials available
5. Email logs cleaned up when table exists

## Cron Schedule
Recommended: Weekly execution
```bash
# Monday 7:05 AM Mountain Time
5 7 * * 1 curl -X POST https://your-domain/internal/retention/run
```

## Implementation Notes
- Always start with dry-run testing (`?dry=1`)
- Monitor logs for Twilio API errors
- Verify compliance with local data laws
- Consider org-specific retention policies via UI