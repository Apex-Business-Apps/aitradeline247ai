# Twilio Integration Preflight Checklist
**Production Readiness Verification - TradeLine 24/7**

---

## PROMPT 1 — Preflight (Constants to Confirm)

### Configuration
- **Canonical webhook domain**: `api.tradeline247ai.com`
  - ✅ IONOS DNS A record configured
  - ✅ CAA record set
  - ✅ SSL certificate active
- **Default forward-to**: `+14319900222` (E.164 format)
- **Defaults**:
  - 🇨🇦 CA-first (country code priority)
  - ✅ `stream_enabled=true`
  - ❌ `recording=OFF` by default
  - ❌ `transcription=OFF` by default
  - 🗣️ Voice: `Polly.Joanna`

### Acceptance Criteria
- [ ] DNS/SSL status shows green in IONOS dashboard
- [ ] Org default toggles visible in Settings UI
- [ ] Bridge target validates as E.164 format

### Evidence Required
```bash
# Verify DNS
dig api.tradeline247ai.com +short
nslookup api.tradeline247ai.com

# Verify SSL
curl -I https://api.tradeline247ai.com
```

Screenshot: Settings page showing default toggles

---

## PROMPT 2 — Provisioner Spot-Check (New Client)

### Test Steps
1. Navigate to `/ops/numbers/onboard`
2. Select **Quick-Start** track
3. Enter test client details:
   - Area Code: `587`
   - Country: `CA`
4. Click "Purchase Number"

### Database Verification
```sql
-- Check twilio_buy_number_logs
SELECT * FROM twilio_buy_number_logs 
WHERE success = true 
ORDER BY created_at DESC LIMIT 1;

-- Check twilio_endpoints
SELECT 
  number_e164,
  voice_url,
  sms_url,
  call_status_callback,
  sms_status_callback
FROM twilio_endpoints
ORDER BY created_at DESC LIMIT 1;
```

### Expected Results
```
VoiceUrl:             https://<base>/functions/v1/voice-answer
SmsUrl:               https://<base>/functions/v1/webcomms-sms-reply
Call StatusCallback:  https://<base>/functions/v1/voice-status
SMS StatusCallback:   https://<base>/functions/v1/webcomms-sms-status
```

### Acceptance Criteria
- [ ] `twilio_buy_number_logs` has ONE success row
- [ ] `twilio_endpoints` has ONE row with all 4 URLs correct
- [ ] Twilio Console shows matching webhook URLs
- [ ] No duplicate rows on page refresh

### Evidence Required
**Screenshot 1**: Twilio Console → Phone Numbers → Active Number → Configuration
**Screenshot 2**: Supabase table editor showing `twilio_endpoints` row

---

## PROMPT 3 — Voice Path (Happy Flow)

### Test Steps
1. Call the newly purchased number from your mobile
2. Listen for: "Hi, you've reached TradeLine 24/7..."
3. Stay on line (don't press any buttons)
4. Verify call bridges to `+14319900222`
5. Complete the call normally

### Database Verification
```sql
-- Check call_logs
SELECT 
  call_sid,
  from_e164,
  to_e164,
  status,
  mode,
  created_at
FROM call_logs
WHERE call_sid = '<CallSid from Twilio Console>'
ORDER BY created_at DESC LIMIT 1;

-- Check voice_stream_logs for fallback
SELECT 
  call_sid,
  fell_back,
  elapsed_ms
FROM voice_stream_logs
WHERE call_sid = '<CallSid>'
LIMIT 1;
```

### Acceptance Criteria
- [ ] Audio heard: consent message in Polly.Joanna voice
- [ ] Call successfully bridges to target
- [ ] ONE row in `call_logs` with `status='completed'`
- [ ] `voice_stream_logs` either empty OR `fell_back=false`
- [ ] No duplicate rows on page refresh

### Evidence Required
**Screenshot 1**: Call completed on mobile (showing duration)
**Screenshot 2**: Supabase `call_logs` table showing the row
**Screenshot 3**: Twilio Console call log

---

## PROMPT 4 — Watchdog Fallback (Stream Timeout)

### Test Setup
Temporarily disable stream handshake by either:
- **Option A**: Set client's `stream_enabled=false` in `voice_config`
- **Option B**: Comment out stream handshake in `voice-stream` function

### Test Steps
1. Call the number again
2. Expect immediate non-stream TwiML (Say→Dial)
3. Verify call still completes successfully

### Database Verification
```sql
-- Check voice_stream_logs for fallback evidence
SELECT 
  call_sid,
  started_at,
  connected_at,
  fell_back,
  elapsed_ms,
  fallback_reason
FROM voice_stream_logs
WHERE call_sid = '<CallSid>'
AND fell_back = true
ORDER BY created_at DESC LIMIT 1;
```

### Acceptance Criteria
- [ ] Call bridges immediately without stream delay
- [ ] `voice_stream_logs` has ONE row with:
  - `fell_back=true`
  - `elapsed_ms` ≈ 3000–4000ms
- [ ] Call still completes successfully (not dropped)
- [ ] No duplicate rows on retries

### Evidence Required
**Screenshot**: `voice_stream_logs` row showing `fell_back=true` and elapsed time

---

## PROMPT 5 — SMS Inbound (Reply + Status)

### Test Steps
1. Send SMS to the new number: `"test inbound"`
2. Verify auto-reply received
3. Check database logs

### Database Verification
```sql
-- Check sms_reply_logs
SELECT 
  message_sid,
  from_e164,
  to_e164,
  body,
  created_at
FROM sms_reply_logs
WHERE source = 'twilio'
ORDER BY created_at DESC LIMIT 1;

-- Check sms_status_logs
SELECT 
  message_sid,
  status,
  created_at
FROM sms_status_logs
WHERE message_sid = '<MessageSid from above>'
ORDER BY created_at DESC LIMIT 1;
```

### Acceptance Criteria
- [ ] Auto-reply received on mobile
- [ ] ONE row in `sms_reply_logs` with `source='twilio'`, unique `external_id=MessageSid`
- [ ] ONE row in `sms_status_logs` with `status='delivered'`
- [ ] Retries update in place (no duplicates)

### Evidence Required
**Screenshot 1**: SMS thread showing inbound + auto-reply
**Screenshot 2**: Both Supabase tables showing the rows

---

## PROMPT 6 — Idempotency & Retries (No Duplicates)

### Test Steps
1. Open Twilio Console → Debugger
2. Find recent webhook delivery for CallSid or MessageSid
3. Click "Replay Webhook"
4. Verify database counts don't increase

### Database Verification
```sql
-- Before replay: count rows
SELECT COUNT(*) FROM call_logs WHERE call_sid = '<CallSid>';
SELECT COUNT(*) FROM sms_reply_logs WHERE message_sid = '<MessageSid>';

-- After replay: count rows again (should be same)
SELECT COUNT(*) FROM call_logs WHERE call_sid = '<CallSid>';
SELECT COUNT(*) FROM sms_reply_logs WHERE message_sid = '<MessageSid>';
```

### Acceptance Criteria
- [ ] Before/after row counts UNCHANGED
- [ ] `updated_at` timestamps MAY update
- [ ] No new rows created on replay
- [ ] Unique constraints prevent duplicates

### Evidence Required
**Screenshot 1**: Twilio Debugger showing replay action
**Screenshot 2**: SQL query results showing same count before/after

---

## PROMPT 7 — A2P Gating (US-Only Toggle)

### Test Steps
1. Open client Settings
2. Toggle **US Texting = ON**
3. Run A2P job via edge function or UI
4. Verify compliance record created
5. Toggle **US Texting = OFF**
6. Verify CA-only posture restored

### Database Verification
```sql
-- Check messaging_compliance
SELECT 
  organization_id,
  brand_sid,
  campaign_sid,
  messaging_service_sid,
  a2p_status,
  us_enabled
FROM messaging_compliance
WHERE organization_id = '<org_id>'
LIMIT 1;
```

### Acceptance Criteria
- [ ] ONE row in `messaging_compliance` per org
- [ ] `brand_sid`, `campaign_sid`, `messaging_service_sid` populated when US enabled
- [ ] `a2p_status='verified'` when approved
- [ ] Re-runs are no-ops (no duplicate Brand/Campaign creation)
- [ ] Toggle OFF preserves data but stops US messaging

### Evidence Required
**Screenshot 1**: Settings UI showing US toggle
**Screenshot 2**: `messaging_compliance` table row
**Screenshot 3**: Twilio Console showing Brand/Campaign SIDs

---

## PROMPT 8 — Hosted-SMS & Full-Port Tracks (Non-Blocking)

### Test Steps (Hosted-SMS)
1. Navigate to `/ops/numbers/onboard`
2. Select **Hosted SMS** track
3. Enter dummy phone number and upload fake LOA
4. Submit form
5. Verify temp number continues routing

### Test Steps (Full-Port)
1. Select **Full Port** track
2. Enter dummy phone number, LOA, and bill
3. Create port order
4. Verify temp number assigned and active

### Database Verification
```sql
-- No specific table checks needed
-- Verify tracking UI shows status
-- Verify temp number still routes calls/SMS
```

### Acceptance Criteria
- [ ] Status visible in UI for both tracks
- [ ] Temp number continues voice routing
- [ ] No blocking of active CA voice on temp number
- [ ] Port tracking doesn't disrupt existing service

### Evidence Required
**Screenshot 1**: Hosted-SMS wizard showing submitted status
**Screenshot 2**: Full-Port wizard showing port order details
**Screenshot 3**: Call test on temp number succeeds

---

## PROMPT 9 — Security (Signature + TLS)

### Test Steps
1. Send synthetic POST to `/voice-answer` WITHOUT valid `X-Twilio-Signature`
2. Verify 403 response
3. Check database unchanged

### Command
```bash
# Test without signature
curl -X POST https://api.tradeline247ai.com/functions/v1/voice-answer \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=CA123&From=%2B15555555555&To=%2B15877428885"

# Expected: HTTP 403 Forbidden
```

### Database Verification
```sql
-- Check call_logs count before and after
SELECT COUNT(*) FROM call_logs;
SELECT COUNT(*) FROM sms_reply_logs;
-- Counts should be UNCHANGED
```

### Acceptance Criteria
- [ ] HTTP log shows `403 Forbidden`
- [ ] No DB writes (`call_logs`, `sms_reply_logs` counts unchanged)
- [ ] Function logs show "Invalid Twilio signature" error
- [ ] Valid signature test succeeds (control test)

### Evidence Required
**Screenshot 1**: curl response showing 403
**Screenshot 2**: Edge Function logs showing signature validation
**Screenshot 3**: Database counts unchanged

---

## PROMPT 10 — Evidence Dashboard (24h)

### Test Steps
1. Navigate to `/ops/twilio-evidence`
2. Verify all tiles load within 1 second
3. Click each tile's link button
4. Verify Supabase views open filtered to last 24h

### Tiles to Verify
- **Inbound Calls**: Answered / Failed / Fallback counts
- **Avg Handshake**: P95 < 1500ms (target)
- **SMS**: Inbound count & delivery success rate
- **Numbers**: Purchased count (24h)

### Acceptance Criteria
- [ ] All tiles render < 1s load time
- [ ] Each tile shows accurate counts
- [ ] Deep-links open correct Supabase table
- [ ] Supabase views pre-filtered to `created_at > NOW() - INTERVAL '24 hours'`
- [ ] P95 handshake badge turns red if > 1500ms

### Evidence Required
**Screenshot 1**: Full dashboard showing all 4 tiles
**Screenshot 2**: Browser network tab showing < 1s load
**Screenshot 3**: Supabase table opened via deep-link (showing filter)

---

## PROMPT 11 — Rollback Levers (Safe, Immediate)

### Rollback Option 1: Disable Streaming Only
```sql
-- Per-client toggle
UPDATE voice_config
SET stream_enabled = false
WHERE organization_id = '<org_id>';
```
**Impact**: Voice path immediately switches to Say→Dial; no stream handshake attempted

### Rollback Option 2: Freeze SMS Routing
```bash
# In Twilio Console, update number's SmsUrl to:
https://<base>/functions/v1/sms-inbound
# (Permanent alias preserves behavior)
```
**Impact**: SMS continues routing via alias; no service interruption

### Rollback Option 3: Release Test Number (Dry Run)
```bash
# 1. Dry run first
curl -X POST https://api.tradeline247ai.com/functions/v1/ops-twilio-buy-number \
  -d '{"dry_run": true, "phone_sid": "PNxxx"}'

# 2. If safe, delete in Twilio Console:
# Phone Numbers → [Number] → Delete
```
**Impact**: Number released; DB row remains for audit; no orphaned records

### Acceptance Criteria
- [ ] Voice path uninterrupted after stream disable
- [ ] SMS routing continues via alias
- [ ] Dry run returns safety check results
- [ ] No orphaned DB rows after number release

### Evidence Required
**Screenshot 1**: `voice_config` table showing `stream_enabled=false`
**Screenshot 2**: Twilio Console showing updated SmsUrl
**Screenshot 3**: Dry run response showing safety checks passed

---

## Master Checklist Summary

### Pre-Launch Verification
- [ ] **PROMPT 1**: DNS/SSL green, defaults confirmed
- [ ] **PROMPT 2**: Provisioner creates single row, correct URLs
- [ ] **PROMPT 3**: Happy path voice call completes
- [ ] **PROMPT 4**: Watchdog fallback triggers correctly
- [ ] **PROMPT 5**: SMS inbound + status logged uniquely
- [ ] **PROMPT 6**: Idempotency prevents duplicates
- [ ] **PROMPT 7**: A2P gating works (US-only)
- [ ] **PROMPT 8**: Hosted-SMS/Port tracks non-blocking
- [ ] **PROMPT 9**: Security rejects invalid signatures
- [ ] **PROMPT 10**: Evidence dashboard loads < 1s
- [ ] **PROMPT 11**: Rollback levers tested and ready

### Final Go/No-Go Decision
**Requirements for LAUNCH**:
- ✅ All 11 prompts pass acceptance criteria
- ✅ Screenshot evidence captured for each
- ✅ Zero manual DB edits required
- ✅ Rollback procedures tested and documented
- ✅ DNS/SSL verified in production
- ✅ Security signatures validated

---

## Emergency Contacts
- **Twilio Support**: https://www.twilio.com/help/support
- **IONOS DNS**: https://www.ionos.com/help
- **Supabase Dashboard**: https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn

## Version
**Document Version**: 1.0  
**Last Updated**: 2025-10-08  
**Next Review**: Pre-launch + 30 days
