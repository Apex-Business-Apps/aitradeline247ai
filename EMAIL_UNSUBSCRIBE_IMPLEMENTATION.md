# Email Unsubscribe Implementation Guide

## Overview
This document describes the CASL-compliant one-click unsubscribe implementation for TradeLine 24/7.

## Architecture

### Database Tables
- **unsubscribes**: Records all unsubscribe requests
- **campaigns**: Email campaign management
- **campaign_members**: Recipients with consent tracking
- **v_sendable_members**: View that auto-filters unsubscribed contacts

### Edge Function
- **Endpoint**: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/unsubscribe`
- **Method**: GET or POST
- **Parameter**: `?e={email}` or POST body `e={email}`
- **Response**: Always 200 (idempotent)

## Required Email Headers

When sending campaign emails via Resend or any email provider, **MUST** include these headers:

```typescript
const headers = {
  'List-Unsubscribe': `<https://www.tradeline247ai.com/unsubscribe?e=${recipientEmail}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
};
```

### Full Resend Example

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'TradeLine 24/7 <hello@tradeline247ai.com>',
  to: recipientEmail,
  subject: 'Your Campaign Subject',
  html: emailBody,
  headers: {
    'List-Unsubscribe': `<https://www.tradeline247ai.com/unsubscribe?e=${recipientEmail}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  }
});
```

## Gmail/Yahoo Compliance

These headers ensure:
- ✅ Gmail shows "Unsubscribe" link at top of email
- ✅ Yahoo honors one-click unsubscribe
- ✅ CASL "easy opt-out" requirement satisfied
- ✅ Instant unsubscribe (no confirmation page required)

## Testing

### Test GET Request
```bash
curl "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/unsubscribe?e=test@example.com"
```

### Test POST Request (One-Click)
```bash
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/unsubscribe" \
  -d "e=test@example.com"
```

### Verify Unsubscribe
```sql
SELECT * FROM public.unsubscribes WHERE email = 'test@example.com';
```

## Campaign Workflow

### 1. Query Sendable Members
```sql
SELECT * FROM public.v_sendable_members 
WHERE campaign_id = 'your-campaign-id';
```

This view automatically excludes:
- Unsubscribed emails
- Invalid consent basis
- Already sent members

### 2. Send Email with Headers
Use the Resend example above with required headers.

### 3. Update Status
```sql
UPDATE public.campaign_members 
SET status = 'sent', sent_at = NOW()
WHERE id = 'member-id';
```

## CASL Consent Basis

Valid consent types in `campaign_members`:
- **express**: Explicit opt-in (checkbox, form submission)
- **implied_ebr**: Existing business relationship
- **implied_published**: Published contact info

## Troubleshooting

### Headers Not Appearing
- Check email provider supports custom headers
- Verify header syntax exactly matches RFC 8058
- Test with Gmail/Yahoo accounts

### Unsubscribes Not Working
- Check Edge Function logs: `https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/functions/unsubscribe/logs`
- Verify email parameter encoding
- Check RLS policies on unsubscribes table

## Production Checklist

- [x] Database tables created
- [x] Edge Function deployed
- [x] Config.toml updated (verify_jwt = false)
- [ ] Email send code includes required headers
- [ ] Twilio SMS webhooks point to Supabase Edge
- [ ] Test unsubscribe flow end-to-end
- [ ] Monitor analytics_events for 'email_unsubscribe'

## Maintenance

### Monitor Unsubscribes
```sql
SELECT 
  DATE(unsubscribed_at) as date,
  COUNT(*) as count,
  source
FROM public.unsubscribes
WHERE unsubscribed_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(unsubscribed_at), source
ORDER BY date DESC;
```

### Clean Old Campaign Data
```sql
-- Archive completed campaigns older than 90 days
UPDATE public.campaigns 
SET status = 'archived'
WHERE status = 'completed' 
AND completed_at < NOW() - INTERVAL '90 days';
```
