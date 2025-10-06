# Campaign Workflow Guide - Warm Leads Outreach

This guide covers the complete 6-step workflow for importing, segmenting, and sending outreach campaigns.

## Prerequisites

1. **Resend API Key**: Set in Supabase Edge Functions secrets
2. **Campaign Created**: "Relaunch — Canada" campaign with V2 template
3. **CSV File**: Prepared lead list at `/warm_contacts_outreach.csv`

## Workflow Steps

### 1. Import Leads (LEADS•IMPORT)

Import your CSV and create the "Warm Leads — Imported" list:

```bash
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-leads-import" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"csv_content\": \"$(cat warm_contacts_outreach.csv)\",
    \"list_name\": \"Warm Leads — Imported\"
  }"
```

**What it does:**
- Parses CSV with automatic column mapping
- Upserts on email (case-insensitive)
- Skips rows without email/phone
- Excludes anyone on unsubscribe list
- Idempotent - safe to re-run

**Expected output:**
```json
{
  "success": true,
  "list_name": "Warm Leads — Imported",
  "total_parsed": 1517,
  "imported": 1450,
  "skipped": {
    "no_email_phone": 12,
    "unsubscribed": 55,
    "invalid": 0
  }
}
```

---

### 2. Create Segment (SEGMENT•WARM50)

Create the "Warm-50" segment with first 50 valid contacts:

```bash
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-segment-warm50" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaign_id\": \"YOUR_CAMPAIGN_ID\",
    \"segment_size\": 50,
    \"seed_emails\": [
      \"test1@yourdomain.com\",
      \"test2@yourdomain.com\"
    ]
  }"
```

**What it does:**
- Takes first 50 valid contacts after CASL filtering
- Adds seed inboxes for testing
- Clears existing members (idempotent replace)
- Creates campaign_members records

**Expected output:**
```json
{
  "success": true,
  "segment_name": "Warm-50",
  "campaign_id": "35143f23-8eec-4193-af2b-8ede449b6fea",
  "total_selected": 50,
  "seeds_added": 2,
  "total_members": 52
}
```

---

### 3. Activate Template (EMAIL•TEMPLATE•V2_ACTIVATE)

✅ **Already completed!** The V2 template is active with:
- Subject: "Can I ask you something quick?"
- Body: 5-minute friend approach
- List-Unsubscribe headers included
- No template signature appended

---

### 4. Send to Warm-50 (SEND•WARM50)

Send 50 emails with throttling:

```bash
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-send-warm50" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaign_id\": \"YOUR_CAMPAIGN_ID\",
    \"max_sends\": 50,
    \"throttle_per_minute\": 30
  }"
```

**What it does:**
- Sends to max 50 contacts
- Throttles to ≤30 emails/minute
- Personalizes with {{first_name}}, {{booking_link}}, {{unsubscribe_link}}
- Includes List-Unsubscribe headers
- Updates member status to 'sent'
- Logs all events

**Gates to scale:**
- Bounces + complaints < 2%
- Complaint rate < 0.3%

**Expected output:**
```json
{
  "success": true,
  "campaign_id": "35143f23-8eec-4193-af2b-8ede449b6fea",
  "results": {
    "sent": 50,
    "failed": 0,
    "throttled": 49
  },
  "warning": null
}
```

---

### 5. Enable Follow-ups (FOLLOWUPS•ON)

Enable reply-first follow-ups (Day 3 nudge, Day 7 final) at 09:15 America/Vancouver:

```bash
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-followups-enable" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaign_id\": \"YOUR_CAMPAIGN_ID\",
    \"day3_enabled\": true,
    \"day7_enabled\": true
  }"
```

**What it does:**
- Schedules Day 3 nudge at 09:15 America/Vancouver time (business hours)
- Schedules Day 7 final at 09:15 America/Vancouver time (business hours)
- Auto-halts on reply/bounce/complaint/unsubscribe
- Always includes one-click unsubscribe in follow-up emails
- Idempotent - safe to re-run

**Example:** If initial email sent at 2:30 PM on Monday, follow-ups will be:
- Day 3: Thursday at 9:15 AM Vancouver time
- Day 7: Monday at 9:15 AM Vancouver time

**Expected output:**
```json
{
  "success": true,
  "campaign_id": "35143f23-8eec-4193-af2b-8ede449b6fea",
  "scheduled_count": 100,
  "day3_enabled": true,
  "day7_enabled": true
}
```

**Processing follow-ups:**
To send pending follow-ups (run via cron or manually):

```bash
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-followups-send" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### 6. Generate Report (REPORT•EXPORT)

Export campaign summary and CSV:

```bash
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-report-export" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaign_id\": \"YOUR_CAMPAIGN_ID\"
  }"
```

**What it does:**
- Generates summary with sent/delivered/bounce/complaint/unsub
- Creates CSV export with all member details
- Logs analytics event

**Expected output:**
```json
{
  "success": true,
  "summary": {
    "campaign_name": "Relaunch — Canada",
    "campaign_id": "35143f23-8eec-4193-af2b-8ede449b6fea",
    "stats": {
      "total": 52,
      "sent": 50,
      "pending": 0,
      "failed": 0,
      "delivered": 0,
      "bounces": 0,
      "complaints": 0,
      "unsubscribed": 2
    },
    "metrics": {
      "send_rate": "96.15%",
      "failure_rate": "0.00%",
      "bounce_rate": "0.00%",
      "complaint_rate": "0.00%",
      "unsubscribe_rate": "4.00%"
    },
    "gates_status": {
      "bounce_plus_complaint_under_2pct": null,
      "complaint_under_0_3pct": null
    },
    "notes": {
      "delivered_tracking": "Requires Resend webhook for resend.emails.delivered",
      "bounce_tracking": "Requires Resend webhook for resend.emails.bounced",
      "complaint_tracking": "Requires Resend webhook for resend.emails.complained"
    },
    "csv_filename": "relaunch_canada_2025-10-06.csv"
  },
  "csv_content": "..."
}
```

**Note:** Delivered/bounce/complaint tracking requires Resend webhook integration.

---

## Monitoring Queries

### Check Campaign Status
```sql
SELECT 
  c.name,
  c.status,
  COUNT(cm.id) as total_members,
  COUNT(cm.id) FILTER (WHERE cm.status = 'sent') as sent,
  COUNT(cm.id) FILTER (WHERE cm.status = 'pending') as pending,
  COUNT(cm.id) FILTER (WHERE cm.status = 'failed') as failed
FROM campaigns c
LEFT JOIN campaign_members cm ON c.id = cm.campaign_id
WHERE c.name = 'Relaunch — Canada'
GROUP BY c.id, c.name, c.status;
```

### Check Follow-up Status
```sql
SELECT 
  followup_number,
  status,
  COUNT(*) as count,
  MIN(scheduled_at) as first_scheduled,
  MAX(scheduled_at) as last_scheduled
FROM campaign_followups
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
GROUP BY followup_number, status
ORDER BY followup_number, status;
```

### Recent Unsubscribes
```sql
SELECT 
  email,
  source,
  created_at as unsubscribed_at
FROM unsubscribes
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## Production Checklist

- [ ] Resend API key configured
- [ ] Test with seed emails first
- [ ] Monitor first batch for 24 hours
- [ ] Check bounce/complaint rates
- [ ] Review unsubscribe rate
- [ ] Scale gradually if metrics pass gates
- [ ] Set up cron for follow-up processing (run hourly during business hours)
- [ ] Verify follow-ups scheduled at 09:15 America/Vancouver

---

## Support

For issues or questions, check:
- Edge function logs in Supabase Dashboard
- `analytics_events` table for detailed logging
- Campaign member statuses for individual failures
