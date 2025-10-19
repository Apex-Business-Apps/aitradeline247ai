# DELTA-FIX Pack Verification Guide
**Non-Breaking Production Hardening for TradeLine 24/7**

---

## PROMPT DF-1 — Canonical Voice URL Switch

### Implementation
✅ Created permanent alias: `/twilio/voice` → `/functions/v1/voice-answer`  
✅ Created permanent alias: `/twilio/status` → `/functions/v1/voice-status`  
✅ Provisioner already uses canonical URLs (verified in `ops-twilio-buy-number`)

### Verification Steps
```bash
# Test legacy alias
curl -X POST https://api.tradeline247ai.com/functions/v1/twilio-voice \
  -H "X-Twilio-Signature: test" \
  -d "CallSid=CA123&From=%2B15555555555&To=%2B15877428885"

# Should forward to /voice-answer (check logs)
```

### Acceptance Criteria
- [x] Legacy `/twilio/voice` links still work (forwards transparently)
- [x] New numbers show `/functions/v1/voice-answer` in Twilio Console
- [ ] **Screenshot**: Twilio Console → Phone Number → VoiceUrl field

---

## PROMPT DF-2 — SMS URL Parity Check

### Implementation
✅ Created permanent alias: `/twilio/sms` → `/functions/v1/webcomms-sms-reply`  
✅ Created permanent alias: `/twilio/sms-status` → `/functions/v1/webcomms-sms-status`  
✅ Provisioner confirmed using:
- `SmsUrl = /functions/v1/webcomms-sms-reply`
- `SMS StatusCallback = /functions/v1/webcomms-sms-status`

### Verification Steps
```bash
# Test legacy SMS alias
curl -X POST https://api.tradeline247ai.com/functions/v1/twilio-sms \
  -H "X-Twilio-Signature: test" \
  -d "MessageSid=SM123&From=%2B15555555555&To=%2B15877428885&Body=test"

# Test legacy status alias
curl -X POST https://api.tradeline247ai.com/functions/v1/twilio-sms-status \
  -H "X-Twilio-Signature: test" \
  -d "MessageSid=SM123&MessageStatus=delivered"
```

### Database Check
```sql
-- Verify single row created (not duplicates)
SELECT COUNT(*) FROM sms_reply_logs WHERE message_sid = 'SM123';
SELECT COUNT(*) FROM sms_status_logs WHERE message_sid = 'SM123';
-- Both should return 1
```

### Acceptance Criteria
- [x] Provisioner sets both SMS URLs correctly
- [x] Legacy aliases log to new tables (no duplicates)
- [ ] **Screenshot**: Twilio Console → Phone Number → SMS URLs

---

## PROMPT DF-3 — Constraints Audit (Dedupe Hardening)

### Implementation
✅ Added UNIQUE constraints via migration:
1. `calls.call_sid` → UNIQUE
2. `call_logs.call_sid` → UNIQUE
3. `sms_reply_logs (source, external_id)` → UNIQUE
4. `sms_status_logs.message_sid` → UNIQUE
5. `twilio_endpoints.number_e164` → UNIQUE
6. `voice_stream_logs.call_sid` → UNIQUE

### Verification Steps
```sql
-- Check constraints exist
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid IN (
  'calls'::regclass,
  'call_logs'::regclass,
  'sms_reply_logs'::regclass,
  'sms_status_logs'::regclass,
  'twilio_endpoints'::regclass,
  'voice_stream_logs'::regclass
)
AND contype = 'u';
```

### Test Duplicate Prevention
```sql
-- Attempt duplicate insert (should fail)
INSERT INTO calls (call_sid, org_id, caller_e164, started_at) 
VALUES ('CA_TEST_DUP', gen_random_uuid(), '+15551234567', NOW());

-- Retry (should fail with constraint violation)
INSERT INTO calls (call_sid, org_id, caller_e164, started_at) 
VALUES ('CA_TEST_DUP', gen_random_uuid(), '+15551234567', NOW());
-- Expected: ERROR duplicate key value violates unique constraint "calls_call_sid_unique"
```

### Acceptance Criteria
- [x] All 6 UNIQUE constraints exist
- [ ] Retried webhooks don't increase row counts
- [ ] Only `updated_at` timestamps change on retries
- [ ] **Query result**: Show constraint violation error

---

## PROMPT DF-4 — Watchdog Telemetry Thresholds

### Implementation
✅ Added alert logic to `/ops/twilio-evidence`:
- **YELLOW**: P95 > 1500ms for 15m OR fallbacks > 5% over 1h
- **RED**: P95 > 2000ms for 15m OR fallbacks > 10% over 1h
- Alert banners display at top of dashboard
- Tile badges color-coded (GREEN/YELLOW/RED)

### Verification Steps
```sql
-- Force yellow alert (simulate high P95)
-- Temporarily set test data
UPDATE voice_stream_logs 
SET elapsed_ms = 1800 
WHERE created_at > NOW() - INTERVAL '15 minutes';

-- Force red alert (simulate very high P95)
UPDATE voice_stream_logs 
SET elapsed_ms = 2500 
WHERE created_at > NOW() - INTERVAL '15 minutes';
```

### Acceptance Criteria
- [x] Tiles display threshold rules in UI
- [x] Alert banners appear when thresholds exceeded
- [x] Color-coded badges (GREEN/YELLOW/RED)
- [ ] Alerts post to ops email (NOTIFY_TO) - **TODO: Add email integration**
- [ ] **Screenshot**: Dashboard showing alert banner

---

## PROMPT DF-5 — Fallback TwiML Bin Verification

### Configuration Required (Twilio Console)
⚠️ **Manual Setup Required**: Create TwiML Bin named "ring group b"

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Connecting you to our team.
  </Say>
  <Dial callerId="+15877428885" record="record-from-answer">
    <Number>+14319900222</Number>
  </Dial>
</Response>
```

### Set as Primary Voice Fallback URL
1. Go to Twilio Console → Phone Numbers → [Your Number]
2. Under "Voice & Fax", set:
   - Primary Handler Fails: `https://handler.twilio.com/twiml/[YOUR_TWIML_BIN_ID]`

### Verification Steps
```sql
-- Check fallback evidence
SELECT 
  call_sid,
  fell_back,
  elapsed_ms,
  fallback_reason,
  created_at
FROM voice_stream_logs
WHERE fell_back = true
ORDER BY created_at DESC
LIMIT 5;
```

### Acceptance Criteria
- [ ] TwiML Bin created with correct dial number (+14319900222)
- [ ] Set as fallback URL in Twilio Console
- [x] Fallback legs tagged with `stream_fallback=true`
- [x] One `voice_stream_logs` row per fallback
- [ ] Call bridges successfully during fallback
- [ ] **Screenshot**: TwiML Bin configuration + Phone Number fallback setting

---

## PROMPT DF-6 — Secrets & Scope Seal

### Environment Variables Checklist
```bash
# Required in Supabase Edge Functions secrets
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...  # For webhook signature verification
TWILIO_API_KEY_SID=SK...  # For Media Streams
TWILIO_API_KEY_SECRET=...  # For Media Streams
BUSINESS_TARGET_E164=+14319900222
SUPABASE_URL=https://hysvqdwmhxnblxfqnszn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

### Verification Steps
```sql
-- Check for signature failures (should be zero)
SELECT COUNT(*) 
FROM analytics_events 
WHERE event_type = 'twilio_signature_failure'
AND created_at > NOW() - INTERVAL '24 hours';
-- Expected: 0

-- Check Twilio Debugger (manual)
-- https://console.twilio.com/us1/monitor/debugger
-- Last 30m: 0 errors
```

### Acceptance Criteria
- [x] All secrets configured in Supabase
- [x] Media Streams use API Key SID/Secret
- [x] Webhooks use Auth Token for signature verification
- [ ] 24h logs show zero signature failures
- [ ] Twilio Debugger clean (0 errors last 30m)
- [ ] **Screenshot**: Twilio Debugger showing 0 errors

---

## EVIDENCE PACK (Screenshots + Queries)

### PROMPT EV-1 — Twilio Console Proof
**Required Screenshot**: Purchased Number Configuration
- Voice URL: `/functions/v1/voice-answer` ✓
- Status Callback: `/functions/v1/voice-status` ✓
- SMS URL: `/functions/v1/webcomms-sms-reply` ✓
- SMS Status Callback: `/functions/v1/webcomms-sms-status` ✓

### PROMPT EV-2 — DB Proofs (Paste Results)
```sql
-- Run after smoke tests
SELECT COUNT(*) AS call_logs_24h FROM call_logs WHERE created_at > NOW() - INTERVAL '24 hours';
SELECT COUNT(*) AS stream_logs_24h FROM voice_stream_logs WHERE created_at > NOW() - INTERVAL '24 hours';
SELECT COUNT(*) AS sms_reply_24h FROM sms_reply_logs WHERE created_at > NOW() - INTERVAL '24 hours';
SELECT COUNT(*) AS sms_status_24h FROM sms_status_logs WHERE created_at > NOW() - INTERVAL '24 hours';
```

**Expected**: Non-zero counts after tests

**Retry Test**:
```sql
-- Repeat queries after webhook retry → counts should be UNCHANGED
```

### PROMPT EV-3 — Watchdog Timing
```sql
SELECT 
  call_sid,
  elapsed_ms,
  fell_back,
  fallback_reason,
  created_at
FROM voice_stream_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**:
- Normal call: `fell_back=false`, `elapsed_ms < 1500`
- Forced test: `fell_back=true`, `elapsed_ms ≈ 3000-4000`

### PROMPT EV-4 — Alias Parity
```bash
# Hit legacy endpoint
curl -X POST https://api.tradeline247ai.com/functions/v1/twilio-sms \
  -H "X-Twilio-Signature: [valid_signature]" \
  -d "MessageSid=SM_ALIAS_TEST&From=%2B15555555555&To=%2B15877428885&Body=alias test"
```

```sql
-- Verify single new row
SELECT COUNT(*) FROM sms_reply_logs WHERE message_sid = 'SM_ALIAS_TEST';
-- Expected: 1 (not 2)

-- Verify source field correct
SELECT source, external_id FROM sms_reply_logs WHERE message_sid = 'SM_ALIAS_TEST';
-- Expected: source='twilio', external_id='SM_ALIAS_TEST'
```

### PROMPT EV-5 — A2P Gating Off (CA-Only)
```sql
-- Canada-only clients should have NO A2P records
SELECT * FROM messaging_compliance WHERE us_enabled = true;
-- Expected: 0 rows for CA-only orgs

-- Verify CA-only org exists
SELECT organization_id, us_enabled FROM messaging_compliance WHERE us_enabled = false;
-- Expected: Rows for CA-only orgs
```

---

## RUN-OF-SHOW (Operator, 5 Minutes)

### PROMPT RS-1 — Buy & Wire
1. Open `/ops/numbers/onboard`
2. Select **Quick-Start** track
3. Enter Area Code: `587`, Country: `CA`
4. Click **Purchase Number**

**Verify**:
```sql
SELECT * FROM twilio_buy_number_logs WHERE success = true ORDER BY created_at DESC LIMIT 1;
SELECT number_e164, voice_url, sms_url FROM twilio_endpoints ORDER BY created_at DESC LIMIT 1;
```

### PROMPT RS-2 — Voice Smoke
1. Call the new number from mobile
2. Listen for Polly.Joanna consent message
3. Verify bridge to `+14319900222`

**Verify**:
```sql
SELECT call_sid, status, mode FROM call_logs ORDER BY created_at DESC LIMIT 1;
SELECT * FROM voice_stream_logs WHERE fell_back = false ORDER BY created_at DESC LIMIT 1;
```

### PROMPT RS-3 — Stream Fallback
1. Temporarily set `stream_enabled=false` OR pause stream init
2. Call number again
3. Verify immediate bridge (no stream delay)

**Verify**:
```sql
SELECT call_sid, fell_back, elapsed_ms FROM voice_stream_logs WHERE fell_back = true ORDER BY created_at DESC LIMIT 1;
```

### PROMPT RS-4 — SMS Smoke
1. Send SMS to number: `"hello"`
2. Verify auto-reply received
3. Check delivery status

**Verify**:
```sql
SELECT * FROM sms_reply_logs ORDER BY created_at DESC LIMIT 1;
SELECT * FROM sms_status_logs WHERE status = 'delivered' ORDER BY created_at DESC LIMIT 1;
```

### PROMPT RS-5 — Dashboard
1. Open `/ops/twilio-evidence`
2. Verify all tiles show green status
3. Click each "View Logs" button
4. Verify Supabase tables open filtered to 24h

---

## GO/NO-GO GATE (Single Screen Checklist)

### Pre-Launch Verification
- [ ] ✅ New CA client provisions with `/voice-answer` + `/webcomms-sms-*` URLs
- [ ] ✅ Duplicate webhook deliveries do NOT increase row counts
- [ ] ✅ P95 handshake < 1500ms (GREEN badge)
- [ ] ✅ Fallbacks < 5% in last hour (GREEN badge)
- [ ] ✅ Twilio Debugger: 0 errors last 30m
- [ ] ✅ Legacy aliases forward transparently (no duplicates)
- [ ] ✅ All 6 UNIQUE constraints enforced
- [ ] ✅ Alert thresholds display correctly

### Evidence Pack Complete
- [ ] Screenshot: Twilio Console phone number config (all 4 URLs)
- [ ] Screenshot: TwiML Bin fallback configuration
- [ ] Screenshot: Evidence dashboard with alert thresholds
- [ ] Screenshot: Twilio Debugger showing 0 errors
- [ ] SQL results: All EV queries pasted with results
- [ ] SQL results: Retry test showing unchanged counts

### Rollback Plan Ready
- [ ] Stream disable lever tested (`stream_enabled=false`)
- [ ] Legacy alias fallback confirmed working
- [ ] TwiML Bin fallback active and tested

---

## Status: READY FOR OPERATOR TESTING

**Next Step**: Complete RUN-OF-SHOW (5 minutes) and capture all evidence screenshots

**Version**: 1.0  
**Last Updated**: 2025-10-08  
**Approver**: [Awaiting operator sign-off]

