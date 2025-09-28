# Weekly Operations Digest

Automated weekly summary of TradeLine 24/7 call center operations.

## Setup

The digest system is automatically wired when you include the enhancements. No additional setup required beyond environment variables.

## Cron Scheduling

Set up a cron job to run the digest every Monday at 07:05 America/Edmonton:

```bash
# Crontab entry (adjust URL to your domain)
5 7 * * 1 curl -X POST https://your-domain.com/internal/digest/run
```

Or use a service like GitHub Actions, AWS CloudWatch Events, or Google Cloud Scheduler:

```yaml
# GitHub Actions example
name: Weekly Digest
on:
  schedule:
    - cron: '5 12 * * 1'  # 07:05 America/Edmonton in UTC (varies by DST)
jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - name: Send digest
        run: curl -X POST ${{ secrets.BASE_URL }}/internal/digest/run
```

## Manual Execution

You can manually trigger the digest at any time:

```bash
curl -X POST https://your-domain.com/internal/digest/run
```

## Report Contents

The weekly digest includes:

### Key Metrics
- Total calls for the week
- Bridged call percentage
- Average ring-to-bridge time
- Missed calls count
- Transcripts processed

### Top Issues
- Top 5 phone numbers with most missed calls
- Recent transcript summaries (newest 10)

### Delivery
- Sent to: `info@tradeline247ai.com`
- Format: HTML email with plain text fallback
- Subject: "TL247 Weekly — Calls & Transcripts Summary"

## Idempotency

The digest endpoint is idempotent - calling it multiple times for the same week will:
- Generate fresh metrics
- Send the email again (not deduplicated)
- Log each generation event

This makes it safe for automated systems and manual testing.

## Troubleshooting

### Missing Data
- Ensure Supabase connection is working
- Check that calls are being logged to `calls` table
- Verify transcripts are in `transcripts` table

### Email Not Sent
- Verify `RESEND_API_KEY` is configured
- Check `EMAIL_FROM` domain is verified in Resend
- Review server logs for Resend API errors

### Scheduling Issues
- Test manual execution first
- Verify cron job has network access
- Check timezone calculations (TIMEZONE env var)

The digest system queries the last 7 days of data based on the current date when executed.