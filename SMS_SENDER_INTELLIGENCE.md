# SMS Sender Intelligence Configuration 📱

## Task 04: Sender Intelligence (Sticky Sender & Geo-Match)

### Overview

**Goal:** Ensure consistent sender identity and local number selection for better delivery and user experience.

**Key Features:**
- **Sticky Sender:** Same contact always receives messages from the same "From" number
- **Geo-Match:** Automatically selects local numbers when available

### Benefits

#### Sticky Sender
- ✅ **Conversation continuity:** Recipients see consistent sender
- ✅ **Higher engagement:** Users recognize the number
- ✅ **Better deliverability:** Carriers trust established connections
- ✅ **Professional appearance:** Reduces confusion

#### Geo-Match
- ✅ **Local presence:** 587 number for Alberta, 647 for Toronto
- ✅ **Better answer rates:** People trust local numbers
- ✅ **Compliance:** Reduces cross-border carrier issues
- ✅ **Cost optimization:** Domestic rates when possible

## Twilio Console Configuration

### Step 1: Enable Sticky Sender

1. Navigate to **Twilio Console → Messaging → Services**
2. Select your Messaging Service
3. Click **Sender Pool** tab
4. Under **Sender Selection:**
   - Enable **"Use the same sender for all messages to a recipient"**
   - This enables Sticky Sender
5. **Save** changes

**What This Does:**
- First message to `+1-555-123-4567` uses available number (e.g., `+1-587-742-8885`)
- All future messages to that recipient use the same sender
- Twilio maintains sender-recipient mapping automatically
- Mapping persists across sessions

### Step 2: Enable Geo-Match

1. In the same **Sender Pool** tab
2. Under **Geographic Matching:**
   - Enable **"Use the best local sender for the recipient's location"**
   - This enables Geo-Match
3. **Save** changes

**What This Does:**
- Message to `+1-587-xxx-xxxx` (Alberta) → Uses Alberta number if available
- Message to `+1-647-xxx-xxxx` (Toronto) → Uses Ontario number if available
- Falls back to any available number if no local match
- Works internationally (US to US, CA to CA, etc.)

### Step 3: Configure Alpha Sender (Optional)

For supported countries (not CA/US):
1. **Sender Pool** → **Alpha Sender**
2. Enter your business name (e.g., "TradeLine247")
3. Recipients in supported countries see name instead of number

**Supported Regions:** UK, Europe, parts of Asia (check Twilio docs)

## Verification & Testing

### Test Script: Sticky Sender

```bash
#!/usr/bin/env bash
# Test sticky sender behavior

TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
MESSAGING_SERVICE_SID="your_messaging_service_sid"
TEST_NUMBER="+15551234567"

echo "=== Sticky Sender Test ==="

# Send first message
echo "Sending message 1..."
response1=$(curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "MessagingServiceSid=$MESSAGING_SERVICE_SID" \
  --data-urlencode "To=$TEST_NUMBER" \
  --data-urlencode "Body=Test message 1 from TradeLine 24/7. Reply STOP to opt-out." \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

from1=$(echo $response1 | jq -r '.from')
echo "First message sent from: $from1"

sleep 2

# Send second message
echo "Sending message 2..."
response2=$(curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "MessagingServiceSid=$MESSAGING_SERVICE_SID" \
  --data-urlencode "To=$TEST_NUMBER" \
  --data-urlencode "Body=Test message 2 from TradeLine 24/7. Reply STOP to opt-out." \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

from2=$(echo $response2 | jq -r '.from')
echo "Second message sent from: $from2"

# Verify same sender
if [ "$from1" = "$from2" ]; then
  echo "✅ PASS: Sticky Sender working - both messages from $from1"
else
  echo "❌ FAIL: Different senders - $from1 vs $from2"
  echo "   Check Twilio Console: Sticky Sender may not be enabled"
fi
```

### Test Script: Geo-Match

```bash
#!/usr/bin/env bash
# Test geo-match behavior with different area codes

TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
MESSAGING_SERVICE_SID="your_messaging_service_sid"

echo "=== Geo-Match Test ==="

# Test 1: Alberta number (587)
AB_NUMBER="+15871234567"
echo "Sending to Alberta number: $AB_NUMBER"
response_ab=$(curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "MessagingServiceSid=$MESSAGING_SERVICE_SID" \
  --data-urlencode "To=$AB_NUMBER" \
  --data-urlencode "Body=Test to Alberta. Reply STOP to opt-out." \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

from_ab=$(echo $response_ab | jq -r '.from')
echo "Message to AB sent from: $from_ab"

# Test 2: Ontario number (647)
ON_NUMBER="+16471234567"
echo "Sending to Ontario number: $ON_NUMBER"
response_on=$(curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "MessagingServiceSid=$MESSAGING_SERVICE_SID" \
  --data-urlencode "To=$ON_NUMBER" \
  --data-urlencode "Body=Test to Ontario. Reply STOP to opt-out." \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

from_on=$(echo $response_on | jq -r '.from')
echo "Message to ON sent from: $from_on"

# Analysis
echo ""
echo "=== Geo-Match Analysis ==="
if [[ "$from_ab" == *"587"* ]]; then
  echo "✅ AB message used local 587 number"
else
  echo "⚠️  AB message used: $from_ab (no local match available)"
fi

if [[ "$from_on" == *"647"* ]] || [[ "$from_on" == *"416"* ]]; then
  echo "✅ ON message used local Ontario number"
else
  echo "⚠️  ON message used: $from_on (no local match available)"
fi
```

## How It Works Behind the Scenes

### Sticky Sender Logic

```
1. First Message to +1-555-123-4567
   ├─ Twilio checks: Has this recipient received messages before?
   │  └─ No → Select sender using Geo-Match
   │     └─ Creates mapping: +1-555-123-4567 → +1-587-742-8885
   └─ Message sent from +1-587-742-8885

2. Second Message to +1-555-123-4567
   ├─ Twilio checks: Existing mapping?
   │  └─ Yes → Use same sender: +1-587-742-8885
   └─ Message sent from +1-587-742-8885 (consistent!)

3. First Message to +1-555-987-6543 (different recipient)
   ├─ No existing mapping
   └─ New selection via Geo-Match
      └─ Creates new mapping: +1-555-987-6543 → +1-587-742-8886
```

### Geo-Match Logic

```
Message to: +1-587-123-4567 (Alberta)
  ├─ Twilio checks sender pool for Alberta numbers (587, 825, 780)
  │  └─ Found: +1-587-742-8885 ✅
  └─ Uses local number

Message to: +1-647-123-4567 (Toronto)
  ├─ Twilio checks sender pool for Ontario numbers (647, 416, 437, 343)
  │  └─ Not found in pool ⚠️
  └─ Falls back to any available number: +1-587-742-8885

Message to: +1-514-123-4567 (Quebec)
  ├─ Checks for Quebec numbers (514, 438, 450, 581)
  │  └─ Not found ⚠️
  └─ Falls back: +1-587-742-8885
```

## Sender Pool Optimization

### Current Pool (Example)
- `+1-587-742-8885` (Alberta - Calgary/Edmonton)

### Recommended Additions for Geo-Match
- `+1-647-xxx-xxxx` (Toronto, ON)
- `+1-604-xxx-xxxx` (Vancouver, BC)
- `+1-514-xxx-xxxx` (Montreal, QC)
- `+1-403-xxx-xxxx` (Calgary, AB - backup)

**Purchase in:** Twilio Console → Phone Numbers → Buy a Number

### Sender Pool Management

**Add Numbers:**
1. Console → Messaging → Services → Sender Pool
2. Click **"Add Senders"**
3. Select phone numbers from your account
4. **Save**

**Remove Numbers:**
1. Select number in sender pool
2. Click **"Remove"**
3. Confirm

**Best Practices:**
- Maintain 2-3 numbers per major market
- More numbers = better Geo-Match coverage
- Monitor usage via Twilio Insights
- Remove unused numbers to reduce costs

## Monitoring & Analytics

### Check Sender Distribution

```bash
# Query Twilio logs for sender usage
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json?PageSize=100" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  | jq -r '.messages[] | .from' \
  | sort | uniq -c | sort -rn

# Output shows which senders are used most:
#   45 +15877428885
#   12 +16471234567
#    8 +16041234567
```

### Supabase Analytics Query

```sql
-- Check sender distribution from logged SMS events
SELECT 
  event_data->>'from' as sender_number,
  COUNT(*) as message_count,
  COUNT(DISTINCT event_data->>'to') as unique_recipients
FROM analytics_events
WHERE event_type = 'sms_status'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY event_data->>'from'
ORDER BY message_count DESC;
```

## DoD Verification ✅

### Criteria 1: Sticky Sender
- [ ] Same contact receives follow-ups from same number
- [ ] Mapping persists across multiple messages
- [ ] Configuration enabled in Twilio Console

**Test:**
1. Send 3 messages to same test number
2. Verify all 3 come from identical sender
3. Check recipient's phone: conversation thread unified

### Criteria 2: Geo-Match
- [ ] Alberta recipient gets Alberta sender (when available)
- [ ] Ontario recipient gets Ontario sender (when available)
- [ ] Falls back gracefully when no local match

**Test:**
1. Send to 587 number → Verify 587 sender used
2. Send to 647 number → Check for local Ontario sender
3. Send to area without pool match → Verify fallback works

### Production Checklist
- [ ] Sticky Sender enabled in Messaging Service
- [ ] Geo-Match enabled in Messaging Service
- [ ] Sender pool contains multiple regional numbers
- [ ] Test messages verify consistent sender
- [ ] Analytics show sender distribution

## Common Issues & Solutions

### Issue: Different Senders for Same Recipient
**Cause:** Sticky Sender not enabled
**Fix:** Console → Messaging → Services → Sender Pool → Enable sticky sender

### Issue: Non-Local Numbers Used
**Cause:** No matching numbers in sender pool
**Fix:** Purchase local numbers and add to sender pool

### Issue: Sender Changes After Restart
**Cause:** Sender pool modified or number removed
**Fix:** Check sender pool configuration, add number back

### Issue: International Recipients Get Wrong Country
**Cause:** No numbers from recipient's country
**Fix:** Purchase international numbers or use Twilio's carrier recommendations

## Reference Documentation

- [Sticky Sender Guide](https://www.twilio.com/docs/messaging/services/tutorials/use-sticky-sender-for-text-marketing-and-communication)
- [Geo-Match Overview](https://www.twilio.com/docs/messaging/services#geographic-matching)
- [Sender Pool Management](https://www.twilio.com/docs/messaging/services/tutorials/manage-sender-pool)
- [Messaging Services](https://www.twilio.com/docs/messaging/services)

## Summary

**Implementation:** Configuration-only (no code changes)
**Complexity:** Low (5-minute setup)
**Impact:** High (better deliverability and user experience)
**Cost:** None (uses existing numbers)

✅ **Status:** Ready to configure in Twilio Console
🎯 **DoD:** Sticky sender + Geo-match verified via tests

