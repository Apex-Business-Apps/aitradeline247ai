# SMS Delivery Observability 📊

## Task 06: Delivery Tracking & Error Monitoring

### Overview

**Goal:** Full visibility into message delivery status, failures, and error codes.

**Status:** ✅ Implemented and production-ready

## What's Implemented

### 1. Delivery Lifecycle Tracking

**Database:** `sms_delivery_log` table tracks every status update

**Lifecycle States:**
- `queued` → Message accepted by Twilio
- `sending` → Being transmitted to carrier
- `sent` → Carrier received message
- `delivered` → Recipient confirmed receipt
- `undelivered` → Failed after initial success
- `failed` → Permanent failure

### 2. Status Callback Integration

**Webhook:** `sms-status` function captures all Twilio status updates

**Captured Data:**
- Message SID (unique identifier)
- Status (current state)
- Error code (if failure)
- Error message (detailed reason)
- Price (cost per message)
- Timestamp (when status changed)

### 3. Dashboard Interface

**Route:** `/sms-delivery`

**Features:**
- ✅ Real-time delivery statistics (last 24 hours)
- ✅ Delivery rate calculation
- ✅ Failed message visibility with error codes
- ✅ Common error patterns
- ✅ Detailed message log table
- ✅ Auto-refresh on status updates

## Twilio Error Codes

### Critical Errors (Permanent Failures)

| Code | Description | Meaning | Action |
|------|-------------|---------|--------|
| `30003` | Unreachable destination handset | Phone powered off or out of service | Retry later, mark as inactive |
| `30004` | Message blocked by carrier | Carrier spam filter | Review content, check opt-in |
| `30005` | Unknown destination handset | Invalid phone number | Remove from list, validate number |
| `30006` | Landline or unreachable carrier | Cannot receive SMS | Mark as landline, don't retry |
| `30007` | Carrier violation or filtering | Spam-like content detected | Review message content |
| `30008` | Unknown error | Carrier-specific issue | Retry with exponential backoff |

### Common Error Patterns

**30003 - Most Common**
- Phone is off
- Out of coverage area
- Number ported to new carrier (not updated)
- **Fix:** Wait 1-24 hours, retry once

**30004 - Content Blocked**
- URL shorteners detected
- Suspicious keywords
- Too many URLs
- **Fix:** Use full URLs, review content against CASL/TCPA

**30007 - Spam Filter**
- High volume to carrier
- Message looks promotional
- No prior relationship
- **Fix:** Ensure consent, add business name, slow send rate

### Transient Errors (Retry Safe)

| Code | Description | Retry? |
|------|-------------|--------|
| `30001` | Queue overflow | Yes, after 1 min |
| `30002` | Account suspended | No (admin action) |
| `30009` | Missing segment | Yes, immediately |

## Dashboard Usage

### Accessing the Dashboard

**URL:** `https://yoursite.https://tradeline247aicom.lovable.app//sms-delivery`

**Requirements:**
- Admin role required
- Authentication enabled

### Statistics Cards

**Total Messages:** All messages in last 24h
**Delivered:** Successfully delivered count
**Failed:** Permanent failures (30003-30010)
**Pending:** Queued/sending/sent (not yet delivered)
**Delivery Rate:** (Delivered / Total) × 100

### Common Errors Section

Shows top 5 error codes with:
- Error code badge
- Human-readable description
- Count of occurrences
- Sample error message

### Recent Deliveries Table

**Columns:**
- **Status:** Visual badge (delivered/failed/pending)
- **To:** Recipient E.164 number
- **Message SID:** Twilio identifier
- **Error:** Code + description (if failed)
- **Price:** Cost per message in USD
- **Time:** Relative time ("5 minutes ago")

**Real-time Updates:**
- New deliveries appear automatically
- Status changes update live
- No page refresh needed

## Monitoring & Alerting

### Key Metrics to Watch

**Delivery Rate:**
- ✅ Good: >95%
- ⚠️ Warning: 90-95%
- ❌ Critical: <90%

**Common Error Trends:**
- 30003 spike → Carrier outage or bad number list
- 30004 spike → Content being flagged
- 30007 spike → Spam filter activation

### Alert Triggers

```sql
-- High failure rate alert (>10%)
SELECT 
  COUNT(*) FILTER (WHERE status IN ('failed', 'undelivered'))::float / COUNT(*) as failure_rate
FROM sms_delivery_log
WHERE created_at > NOW() - INTERVAL '1 hour'
HAVING failure_rate > 0.1;
```

```sql
-- Specific error code spike
SELECT error_code, COUNT(*) as count
FROM sms_delivery_log
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND error_code IS NOT NULL
GROUP BY error_code
HAVING COUNT(*) > 10
ORDER BY count DESC;
```

### Supabase Analytics Query

```sql
-- Daily delivery summary
SELECT 
  DATE(created_at) as date,
  status,
  COUNT(*) as message_count,
  SUM(price) as total_cost
FROM sms_delivery_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), status
ORDER BY date DESC, status;
```

## Integration with Sending Logic

### Before Sending

```typescript
// Check if number has history of failures
const { data: recentFailures } = await supabase
  .from('sms_delivery_log')
  .select('error_code, created_at')
  .eq('to_e164', recipientE164)
  .in('status', ['failed', 'undelivered'])
  .order('created_at', { ascending: false })
  .limit(3);

if (recentFailures && recentFailures.length >= 2) {
  // Too many recent failures - don't send
  console.log('Skipping send to frequently failing number');
  return;
}
```

### After Sending (Initial Log)

```typescript
// When sending via Twilio
const message = await twilioClient.messages.create({
  to: recipientE164,
  messagingServiceSid: 'MGXXX',
  body: messageBody
});

// Create initial log entry
await supabase.from('sms_delivery_log').insert({
  message_sid: message.sid,
  to_e164: recipientE164,
  from_e164: message.from,
  body_preview: messageBody.substring(0, 100),
  status: 'queued',
  num_segments: message.numSegments
});
```

### Status Updates (Webhook)

Status updates are handled automatically by the `sms-status` webhook:

```typescript
// sms-status function updates the log
await supabase.from('sms_delivery_log').upsert({
  message_sid: messageSid,
  status: newStatus,
  error_code: errorCode,
  error_message: errorMessage,
  price: parseFloat(price),
  status_updated_at: now()
}, {
  onConflict: 'message_sid'
});
```

## Troubleshooting Delivery Issues

### High 30003 Rate (Unreachable)

**Symptoms:** Many messages failing with 30003
**Causes:**
- Old/stale contact list
- Ported numbers not updated
- Carrier outage

**Actions:**
1. Run Twilio Lookup on failed numbers
2. Remove permanently unreachable numbers
3. Retry after 24 hours for temporary issues
4. Check carrier status pages

### High 30004/30007 Rate (Blocked/Filtered)

**Symptoms:** Messages blocked by carrier
**Causes:**
- Promotional content without consent
- Too many URLs or shortened links
- High send rate to single carrier
- Missing business identification

**Actions:**
1. Review message content against CASL
2. Add business name to all messages
3. Include "Reply STOP" unsubscribe
4. Use full URLs (not bit.ly)
5. Slow down send rate (max 100/min per carrier)
6. Verify opt-in consent exists

### Inconsistent Delivery Rates

**Symptoms:** Delivery rate varies by carrier
**Causes:**
- Different carrier filtering rules
- Geographic coverage differences
- Sender reputation per carrier

**Actions:**
1. Check delivery rate by carrier (via Lookup data)
2. Monitor carrier-specific error codes
3. Adjust message content per carrier if needed
4. Consider carrier-specific sender numbers (Geo-Match)

## Cost Tracking

### Price Breakdown

**Per-Message Cost:**
- SMS (1 segment): ~$0.0075 USD
- MMS: ~$0.02 USD
- International: Varies by country

**Daily Cost Query:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as messages_sent,
  SUM(price) as total_cost,
  AVG(price) as avg_cost_per_message
FROM sms_delivery_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Budget Alerts

Set up alerts when daily spend exceeds threshold:

```typescript
const { data: dailyCost } = await supabase
  .from('sms_delivery_log')
  .select('price')
  .gte('created_at', new Date().setHours(0, 0, 0, 0));

const totalToday = dailyCost?.reduce((sum, log) => sum + (log.price || 0), 0) || 0;

if (totalToday > 50) { // $50 daily budget
  // Send alert to admin
  console.warn(`Daily SMS cost: $${totalToday.toFixed(2)}`);
}
```

## DoD Verification ✅

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Status callback records lifecycle | ✅ | `sms-status` webhook logs all states |
| Failed deliveries visible | ✅ | Dashboard shows error codes + timestamps |
| Error codes displayed | ✅ | 30003, 30007, etc. with descriptions |
| Last 24h dashboard | ✅ | `/sms-delivery` route with real-time data |
| Delivery rate calculated | ✅ | `get_sms_delivery_stats()` function |

## Testing

### Test Failed Delivery

Twilio provides test numbers that trigger specific error codes:

```bash
# Test 30003 error (unreachable)
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "MessagingServiceSid=$MESSAGING_SERVICE_SID" \
  --data-urlencode "To=+15005550001" \
  --data-urlencode "Body=Test delivery failure" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Result: Message will fail with error 30003
# Check dashboard: Error should appear within 1-5 minutes
```

### Test Successful Delivery

```bash
# Send to your real number
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "MessagingServiceSid=$MESSAGING_SERVICE_SID" \
  --data-urlencode "To=+15877428885" \
  --data-urlencode "Body=Test successful delivery" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Check dashboard: Should show queued → sent → delivered
```

### Verify Real-time Updates

1. Send a test message
2. Open dashboard at `/sms-delivery`
3. Observe status progression:
   - Immediately: `queued`
   - ~1 second: `sent`
   - ~5-10 seconds: `delivered`

## References

- [Twilio Status Callbacks](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply#receive-inbound-messages)
- [SMS Error Codes](https://www.twilio.com/docs/api/errors)
- [Message Status Values](https://www.twilio.com/docs/sms/api/message-resource#message-status-values)
- [Status Callback Events](https://www.twilio.com/docs/usage/webhooks/sms-webhooks)

## Summary

✅ **Status Tracking:** All lifecycle events logged
✅ **Error Visibility:** Failed deliveries with error codes
✅ **Dashboard:** Real-time `/sms-delivery` interface
✅ **Statistics:** Delivery rate and error trends
✅ **Monitoring:** Query functions for alerting
✅ **Production Ready:** Full observability active

**Next Action:** Configure alerting for high failure rates (optional)

