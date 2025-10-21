# Task 04: Sender Intelligence - Configuration Guide ✅

## Overview

**Goal:** Consistent "From" numbers and intelligent geographic sender selection

**Status:** ✅ Documentation and verification tools ready

## What Needs to be Configured (Twilio Console)

### 1. Enable Sticky Sender

**Location:** Twilio Console → Messaging → Services → [Your Service] → Sender Pool

**Steps:**
1. Navigate to Sender Pool settings
2. Under **"Sender Selection"**, enable:
   - ☑️ "Use the same sender for all messages to a recipient"
3. **Save** configuration

**Result:** Each recipient will receive all messages from the same phone number, creating a unified conversation thread.

### 2. Enable Geo-Match

**Location:** Same page (Sender Pool)

**Steps:**
1. Under **"Geographic Matching"**, enable:
   - ☑️ "Use the best local sender for the recipient's location"
2. **Save** configuration

**Result:** Messages automatically route through locally-matching phone numbers when available in your sender pool.

## Verification

### Quick Test (Manual)

**Using your phone:**
1. Send test SMS to your personal number 3 times
2. Check your messages: All 3 should come from the same "From" number
3. ✅ If yes → Sticky Sender working
4. ❌ If no → Check Twilio Console configuration

### Automated Test Script

```bash
# Set credentials
export TWILIO_ACCOUNT_SID=your_account_sid
export TWILIO_AUTH_TOKEN=your_auth_token
export MESSAGING_SERVICE_SID=your_messaging_service_sid

# Run test
chmod +x scripts/test_sender_intelligence.sh
./scripts/test_sender_intelligence.sh +15551234567
```

**Expected Output:**
```
📌 TEST 1: Sticky Sender Verification
   Message 1 from: +15877428885
   Message 2 from: +15877428885
   Message 3 from: +15877428885
   ✅ PASS: All messages from same sender (+15877428885)
   ✅ Sticky Sender is working correctly
```

### Multi-Region Geo-Match Test

```bash
# Test with numbers from different regions
./scripts/test_sender_intelligence.sh \
  +15871234567 \  # Alberta
  +16471234567 \  # Ontario
  +16041234567    # BC
```

**Expected:** Each region gets a local sender when available in pool.

## DoD Criteria ✅

| Requirement | Status | Verification |
|-------------|--------|--------------|
| Sticky Sender enabled | ⚙️ **Config Required** | Console setting |
| Geo-Match enabled | ⚙️ **Config Required** | Console setting |
| Same contact gets same sender | ✅ **Ready to Test** | Test script |
| Local numbers preferred | ✅ **Ready to Test** | Multi-region test |
| Falls back gracefully | ✅ **Automatic** | Twilio handles |

## Current Sender Pool

**Your Numbers:**
- `+1-587-742-8885` (Alberta - Calgary/Edmonton)

**Recommendations for Better Geo-Match:**
- Add `+1-647-xxx-xxxx` (Toronto, ON) for Ontario customers
- Add `+1-604-xxx-xxxx` (Vancouver, BC) for BC customers
- Add `+1-514-xxx-xxxx` (Montreal, QC) for Quebec customers

**Purchase:** Twilio Console → Phone Numbers → Buy a Number

## Benefits Delivered

### User Experience
- ✅ **Consistent identity:** Recipients recognize your number
- ✅ **Unified threads:** All messages in one conversation
- ✅ **Local trust:** Customers see familiar area codes
- ✅ **Professional:** No confusion from multiple senders

### Technical Benefits
- ✅ **Better deliverability:** Carriers trust established sender-recipient pairs
- ✅ **Automatic routing:** Twilio handles sender selection
- ✅ **Scalable:** Works with any sender pool size
- ✅ **No code changes:** Pure configuration

## Implementation Checklist

### Step 1: Twilio Console (5 minutes)
- [ ] Log into Twilio Console
- [ ] Navigate to Messaging → Services
- [ ] Select your Messaging Service
- [ ] Go to Sender Pool tab
- [ ] Enable "Sticky Sender"
- [ ] Enable "Geo-Match"
- [ ] Save configuration

### Step 2: Verification (5 minutes)
- [ ] Run test script with your phone number
- [ ] Verify 3 messages use same sender
- [ ] Check Twilio logs for sender distribution
- [ ] Confirm no errors in webhook logs

### Step 3: Optional - Expand Sender Pool
- [ ] Identify target markets (ON, BC, QC, etc.)
- [ ] Purchase local numbers for each market
- [ ] Add numbers to Messaging Service sender pool
- [ ] Re-run Geo-Match test

## Monitoring

### Twilio Console
**Location:** Console → Messaging → Insights

**Metrics to Watch:**
- Sender distribution (which numbers used most)
- Delivery rates by sender
- Opt-out rates per sender
- Geographic message distribution

### Supabase Analytics

```sql
-- Check sender usage from logs
SELECT 
  event_data->>'from' as sender_number,
  COUNT(*) as messages_sent,
  COUNT(DISTINCT event_data->>'to') as unique_recipients
FROM analytics_events
WHERE event_type = 'sms_status'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY sender_number
ORDER BY messages_sent DESC;
```

## Troubleshooting

### Issue: Different Senders for Same Recipient
**Symptoms:** Customer receives messages from multiple numbers
**Cause:** Sticky Sender not enabled
**Fix:**
1. Twilio Console → Messaging → Services
2. Sender Pool → Enable sticky sender
3. Wait 5 minutes for change to propagate
4. Test again

### Issue: Non-Local Numbers Used
**Symptoms:** Toronto customer gets Alberta number
**Cause:** No Ontario numbers in sender pool
**Fix:**
1. Purchase Toronto number (647/416)
2. Add to sender pool
3. New Toronto messages will use local number
4. Existing mappings remain (sticky sender)

### Issue: Sender Changes After Time
**Symptoms:** Different sender after days/weeks
**Cause:** Sender mapping expired or pool changed
**Fix:**
1. Check sender pool for removed numbers
2. Verify Sticky Sender still enabled
3. Review Twilio logs for mapping resets

## Cost Analysis

**Configuration Cost:** $0 (uses existing numbers)

**Additional Numbers (Optional):**
- Canadian local number: ~$1/month
- US local number: ~$1/month
- Per-message cost: Same regardless of sender selection

**ROI:**
- Higher answer rates (local numbers)
- Better engagement (consistent sender)
- Reduced opt-outs (professional appearance)
- Improved deliverability

## References

- [Twilio Sticky Sender Documentation](https://www.twilio.com/docs/messaging/services/tutorials/use-sticky-sender-for-text-marketing-and-communication)
- [Geographic Matching Guide](https://www.twilio.com/docs/messaging/services#geographic-matching)
- [Sender Pool Management](https://www.twilio.com/docs/messaging/services/tutorials/manage-sender-pool)
- [Messaging Services Overview](https://www.twilio.com/docs/messaging/services)

## Task Status

✅ **Documentation:** Complete
✅ **Test Scripts:** Created and ready
✅ **Configuration Guide:** Detailed steps provided
⚙️ **Twilio Configuration:** Requires user action (5 minutes)
✅ **DoD Ready:** All criteria testable

**Next Action:** Configure Sticky Sender and Geo-Match in Twilio Console (see Step 1 above)

