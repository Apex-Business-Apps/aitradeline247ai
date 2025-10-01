# Phase H-T4 — Optional Recording Enablement (Consent Gate)

**Status**: ⏳ OPTIONAL (AWAITING APPROVAL)  
**Date**: 2025-10-01  
**Phase**: H-T4 — Enable call recording with consent/opt-out gate

---

## Overview

This phase enables call recording with a mandatory consent/opt-out gate as designed in `HOTLINE_CONSENT_DRAFT.md`. Recording only begins after positive DTMF consent (press 1). Opt-out (press 9) or timeout results in call hangup. All consent decisions are logged for audit.

---

## Prerequisites

- ✅ Phase H-T1, H-T2, H-T3 complete
- ✅ Stable Canada-only operation (or allowlist-only if H-T3 skipped)
- ⏳ **LEGAL/PRIVACY APPROVAL** for consent wording in `HOTLINE_CONSENT_DRAFT.md`
- ⏳ **STAKEHOLDER SIGN-OFF** on recording policy

---

## ⚠️ CRITICAL: Legal Approval Required

**DO NOT enable recording without explicit approval from**:
- Legal counsel (consent wording compliance)
- Privacy officer (PIPEDA/PIPA compliance)
- Stakeholder sign-off (recording policy)

---

## Configuration

### Enable Recording

```bash
# Environment variable (set in Supabase Edge Function secrets)
HOTLINE_RECORDING_ENABLED=true
```

### Verify Configuration

```sql
-- Check recording flag (not stored in DB, set via env)
-- Verify via edge function logs after first call

-- View consent audit log
SELECT * FROM public.hotline_consent_audit 
ORDER BY created_at DESC LIMIT 10;
```

---

## Call Flow (Recording Enabled)

```
1. Incoming Call → Twilio Webhook
   ↓
2. Security Gate (Signature Validation)
   ↓
3. Rate Limit Check
   ↓
4. Allowlist Check (if applicable)
   ↓
5. Geo Check (if applicable)
   ↓
6. Language Selection (EN/FR-CA)
   ↓
7. ✅ CONSENT GATE (ACTIVE WITH RECORDING)
   - Present consent script (EN/FR-CA)
   - "Press 1 to consent and continue, or press 9 to opt out"
   - Wait for DTMF input (timeout: 10 seconds)
   - DTMF 1 → Consent given → Start recording → Continue to IVR
   - DTMF 9 → Opt-out → Log decision → Hangup
   - Timeout → No consent → Log decision → Hangup
   ↓
8. 🔴 RECORDING ACTIVE (if consent given)
   ↓
9. IVR Menu (DTMF: 1=Support, 2=Sales)
   ↓
10. Route to Handler or Voicemail
   ↓
11. Call Ends → Recording saved to Twilio
```

---

## Consent Scripts (from HOTLINE_CONSENT_DRAFT.md)

### English (EN)

```
"Thank you for calling TradeLine 24/7. This call may be recorded for quality assurance and training purposes. To consent to recording and continue, press 1. To opt out, press 9. If you do nothing, the call will end."
```

### French (FR-CA)

```
"Merci d'avoir appelé TradeLine 24/7. Cet appel peut être enregistré à des fins d'assurance qualité et de formation. Pour consentir à l'enregistrement et continuer, appuyez sur 1. Pour refuser, appuyez sur 9. Si vous ne faites rien, l'appel se terminera."
```

---

## Consent Decision Logging

All consent decisions are logged to `hotline_consent_audit`:

### Schema

```sql
CREATE TABLE public.hotline_consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  call_sid TEXT NOT NULL,
  ani_hash TEXT NOT NULL,  -- SHA256 of phone number
  consent_status TEXT NOT NULL,  -- 'consented', 'opted_out', 'timeout'
  language TEXT NOT NULL,  -- 'en', 'fr-CA'
  dtmf_input TEXT  -- '1', '9', or NULL
);
```

### Example Logs

```sql
-- View recent consent decisions
SELECT 
  created_at,
  call_sid,
  consent_status,
  language,
  dtmf_input
FROM public.hotline_consent_audit
ORDER BY created_at DESC
LIMIT 20;

-- Consent statistics
SELECT 
  consent_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.hotline_consent_audit
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY consent_status;
```

---

## Test Scenarios

### Scenario 1: Consent Given (Press 1)

**Input**:
- Canadian caller: +14035551234
- Language: English
- DTMF input: 1 (within 10 seconds)

**Expected**:
- ✅ Consent script presented (EN)
- ✅ DTMF 1 received
- ✅ Consent logged to hotline_consent_audit
- ✅ Recording started
- ✅ IVR menu presented
- ✅ Call continues normally

**Logs**:
```
✅ Language: EN
✅ Presenting consent script
✅ DTMF input received: 1
✅ Consent given, starting recording
✅ Logged to consent_audit: consented
✅ Presenting IVR menu
```

**Audit Log**:
```
consent_status: 'consented'
language: 'en'
dtmf_input: '1'
```

---

### Scenario 2: Opt-Out (Press 9)

**Input**:
- Canadian caller: +15141234567
- Language: French (FR-CA)
- DTMF input: 9 (within 10 seconds)

**Expected**:
- ✅ Consent script presented (FR-CA)
- ✅ DTMF 9 received
- ✅ Opt-out logged to hotline_consent_audit
- ❌ Recording NOT started
- ❌ Call ends with polite goodbye

**Response (TwiML)**:
```xml
<Response>
  <Say voice="Polly.Chantal" language="fr-CA">
    Vous avez choisi de ne pas participer. Merci d'avoir appelé. Au revoir.
  </Say>
  <Hangup/>
</Response>
```

**Logs**:
```
✅ Language: FR-CA
✅ Presenting consent script
✅ DTMF input received: 9
🚫 Opt-out selected
✅ Logged to consent_audit: opted_out
❌ Recording NOT started
🔚 Call ended
```

**Audit Log**:
```
consent_status: 'opted_out'
language: 'fr-CA'
dtmf_input: '9'
```

---

### Scenario 3: Timeout (No Input)

**Input**:
- Canadian caller: +14161234567
- Language: English
- DTMF input: None (10 second timeout)

**Expected**:
- ✅ Consent script presented (EN)
- ⏱️ Timeout after 10 seconds
- ✅ Timeout logged to hotline_consent_audit
- ❌ Recording NOT started
- ❌ Call ends with timeout message

**Response (TwiML)**:
```xml
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    We didn't receive your selection. This call will now end. Goodbye.
  </Say>
  <Hangup/>
</Response>
```

**Logs**:
```
✅ Language: EN
✅ Presenting consent script
⏱️ No DTMF input (timeout)
✅ Logged to consent_audit: timeout
❌ Recording NOT started
🔚 Call ended
```

**Audit Log**:
```
consent_status: 'timeout'
language: 'en'
dtmf_input: NULL
```

---

## Monitoring & Compliance

### Consent Rate

```sql
-- Consent rate (past 7 days)
SELECT 
  COUNT(*) FILTER (WHERE consent_status = 'consented') as consented,
  COUNT(*) FILTER (WHERE consent_status = 'opted_out') as opted_out,
  COUNT(*) FILTER (WHERE consent_status = 'timeout') as timeout,
  ROUND(
    COUNT(*) FILTER (WHERE consent_status = 'consented') * 100.0 / COUNT(*), 
    2
  ) as consent_rate_pct
FROM public.hotline_consent_audit
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Recording Metadata (Twilio)

Recordings are stored in Twilio and linked to the call SID. Retrieve via Twilio API:

```javascript
// Example: Fetch recordings for a call
const recordings = await twilioClient.recordings
  .list({ callSid: 'CA1234567890abcdef' });

console.log(recordings[0].uri);
// /2010-04-01/Accounts/{AccountSid}/Recordings/{RecordingSid}
```

---

## Security & Privacy

### ✅ Consent Enforcement
- [ ] Consent script presented before recording
- [ ] Opt-out option clearly stated
- [ ] Timeout results in no recording
- [ ] All decisions logged with timestamp

### ✅ PII Protection
- [ ] Phone numbers hashed (SHA256) in audit logs
- [ ] Recordings stored in Twilio (encrypted at rest)
- [ ] Access to recordings restricted (admin-only via Twilio console)
- [ ] Retention policy applied (Twilio auto-delete after 90 days)

### ✅ Compliance (PIPEDA/PIPA)
- [ ] Consent obtained before recording
- [ ] Opt-out mechanism provided
- [ ] Purpose of recording clearly stated
- [ ] Data minimization (only record consented calls)
- [ ] Audit trail maintained

---

## Rollback Procedure

```bash
# Disable recording immediately
HOTLINE_RECORDING_ENABLED=false

# Verify in logs
# All subsequent calls should show "Recording OFF" in consent gate
```

```sql
-- View recent calls (post-rollback)
SELECT 
  call_sid,
  consent_given,
  created_at
FROM public.hotline_call_sessions
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- If consent_given is NULL or false, recording is OFF
```

---

## Known Limitations

1. **Twilio recording storage**: Recordings stored in Twilio (not Supabase)
2. **Retention policy**: Must configure auto-delete in Twilio console
3. **Access control**: Recording access via Twilio console (admin-level)
4. **Language detection**: Language must be selected before consent (EN/FR-CA)

---

## Next Steps (Before H-T5)

1. ⏳ **OBTAIN LEGAL/PRIVACY APPROVAL** for consent wording
2. ⏳ Set `HOTLINE_RECORDING_ENABLED=true`
3. ⏳ Make test calls with consent (press 1)
4. ⏳ Make test calls with opt-out (press 9)
5. ⏳ Make test calls with timeout (no input)
6. ⏳ Verify all consent decisions logged
7. ⏳ Verify recordings appear in Twilio console
8. ⏳ Configure Twilio auto-delete after 90 days
9. ⏳ Monitor consent rate for 24 hours

---

**Phase H-T4 Status**: Ready for recording enablement pending legal/privacy approval.
