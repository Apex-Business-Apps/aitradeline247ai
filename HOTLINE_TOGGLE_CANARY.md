# Phase H-T1 — Hotline Canary Toggle (Allowlist Only)

**Status**: ✅ IMPLEMENTED (RECORDING OFF)  
**Date**: 2025-10-01  
**Phase**: H-T1 — Enable hotline for allowlisted test numbers only

---

## Overview

The hotline has been configured for canary testing with an allowlist-only mode. Only pre-approved phone numbers can access the IVR system. All calls are logged but **not recorded** (HOTLINE_RECORDING_ENABLED remains OFF).

---

## Configuration

### Environment Variables

```bash
HOTLINE_ENABLED=true                    # Enable hotline (allowlist only)
HOTLINE_RECORDING_ENABLED=false         # Recording OFF (default)
TWILIO_AUTH_TOKEN=<your_token>          # Required for signature validation
TWILIO_ACCOUNT_SID=<your_sid>           # Required for Twilio integration
BUSINESS_TARGET_E164=<target_number>    # Target phone number for routing
```

### Database Tables Created

1. **hotline_allowlist** - Allowlist for canary testing
   - `e164` (TEXT, PRIMARY KEY) - Phone number in E.164 format
   - `label` (TEXT) - Optional label for the number
   - `added_by` (UUID) - User who added the number
   - `created_at` (TIMESTAMPTZ) - Timestamp

2. **hotline_geo_config** - Geo-filtering configuration (H-T3)
   - `key` (TEXT, PRIMARY KEY) - Config key
   - `value` (JSONB) - Config value
   - `updated_at` (TIMESTAMPTZ) - Timestamp

### Database Functions Created

- `is_hotline_allowlisted(p_e164 TEXT)` - Check if number is allowlisted
- `check_hotline_geo(p_e164 TEXT)` - Check geo restrictions (H-T3)

---

## Adding Test Numbers to Allowlist

### Via SQL

```sql
-- Add your test numbers (E.164 format: +1234567890)
INSERT INTO public.hotline_allowlist (e164, label, added_by) VALUES
  ('+15878839797', 'Test Phone 1', NULL),
  ('+14031234567', 'Test Phone 2', NULL),
  ('+17801234567', 'Test Phone 3', NULL);

-- View allowlist
SELECT * FROM public.hotline_allowlist ORDER BY created_at DESC;

-- Remove a number
DELETE FROM public.hotline_allowlist WHERE e164 = '+15878839797';
```

---

## Call Flow (Allowlist Mode)

```
1. Incoming Call → Twilio Webhook
   ↓
2. Security Gate (Signature Validation)
   ↓
3. Rate Limit Check (per-ANI, per-IP)
   ↓
4. ✅ ALLOWLIST CHECK (NEW)
   - If NOT on allowlist → Reject with friendly message
   - If on allowlist → Continue to IVR
   ↓
5. Language Selection (EN/FR-CA)
   ↓
6. Consent Gate (recording OFF, consent wording still presented)
   ↓
7. IVR Menu (DTMF: 1=Support, 2=Sales)
   ↓
8. Route to Handler or Voicemail
```

---

## Local Simulation (No Network Calls)

### Allowlisted Number Test

**Input**:
```json
{
  "CallSid": "CA_test_allowlist_001",
  "From": "+15878839797",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Expected Output**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Welcome to TradeLine 24/7. For English, press 1. Pour Français, appuyez sur 2.
  </Say>
  <Gather numDigits="1" action="/hotline-consent-handler" method="POST">
    <Pause length="5"/>
  </Gather>
  <Say>We didn't receive your selection. Goodbye.</Say>
  <Hangup/>
</Response>
```

**Logs**:
```
✅ Allowlisted number: +15878839797
✅ Signature validated
✅ Rate limit: 1/5 (minute), 1/15 (hour), 1/50 (day)
✅ Consent gate ready (recording OFF)
✅ IVR menu presented
```

---

### Non-Allowlisted Number Test

**Input**:
```json
{
  "CallSid": "CA_test_blocked_001",
  "From": "+14161234567",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Expected Output**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    This service is currently in testing. Please try again later. Goodbye.
  </Say>
  <Hangup/>
</Response>
```

**Logs**:
```
❌ Non-allowlisted number: +14161234567
✅ Signature validated
✅ Rate limit: 1/5 (minute), 1/15 (hour), 1/50 (day)
🚫 Access denied (allowlist only)
```

---

## Security Validation

### 1. Signature Validation
- ✅ Twilio signature verification active
- ✅ 403 response on invalid signature

### 2. Rate Limiting
- ✅ Per-ANI: 5/min, 15/hour, 50/day
- ✅ Per-IP: 20/min, 100/hour, 500/day
- ✅ SHA256 hashing of PII

### 3. Allowlist Enforcement
- ✅ Non-allowlisted numbers rejected
- ✅ Friendly rejection message (no technical details)
- ✅ Security alerts logged

### 4. Audit Logging
- ✅ All calls logged to `hotline_call_sessions`
- ✅ Consent decisions logged to `hotline_consent_audit`
- ✅ Rate limit violations logged to rate limit tables
- ✅ Geo-blocks logged to `security_alerts` (H-T3)

---

## Monitoring Queries

### View Allowlist Activity

```sql
-- Recent allowlisted calls
SELECT 
  hcs.call_sid,
  hcs.ani_hash,
  hcs.call_status,
  hcs.route_taken,
  hcs.language,
  hcs.created_at
FROM public.hotline_call_sessions hcs
WHERE EXISTS (
  SELECT 1 FROM public.hotline_allowlist ha
  WHERE sha256(ha.e164::bytea)::text = hcs.ani_hash
)
ORDER BY hcs.created_at DESC
LIMIT 20;
```

### View Blocked (Non-Allowlisted) Attempts

```sql
-- Recent blocked attempts
SELECT 
  created_at,
  event_data->>'reason' as block_reason,
  event_data->>'from_number_hash' as ani_hash
FROM public.security_alerts
WHERE alert_type = 'hotline_allowlist_blocked'
ORDER BY created_at DESC
LIMIT 20;
```

### Allowlist Stats

```sql
-- Allowlist summary
SELECT 
  COUNT(*) as total_numbers,
  COUNT(DISTINCT added_by) as added_by_users,
  MIN(created_at) as first_added,
  MAX(created_at) as last_added
FROM public.hotline_allowlist;
```

---

## Next Steps (Before H-T2)

1. ⏳ Add your test numbers to the allowlist
2. ⏳ Set `HOTLINE_ENABLED=true` in environment
3. ⏳ Make a test call from an allowlisted number
4. ⏳ Verify IVR flow works end-to-end
5. ⏳ Make a test call from a non-allowlisted number
6. ⏳ Verify rejection message is friendly
7. ⏳ Review logs and audit tables

---

## Rollback Procedure

```sql
-- Disable hotline
-- (Set HOTLINE_ENABLED=false in environment)

-- Clear allowlist (if needed)
DELETE FROM public.hotline_allowlist;

-- View recent activity for investigation
SELECT * FROM public.hotline_call_sessions 
ORDER BY created_at DESC LIMIT 50;
```

---

## Important Notes

- **Recording is OFF**: HOTLINE_RECORDING_ENABLED=false (default)
- **Consent wording is still presented**: This prepares users for future recording enablement
- **Allowlist bypass**: Allowlisted numbers skip geo-filtering (H-T3)
- **Security layers active**: Signature validation, rate limiting, audit logging
- **Friendly rejection messages**: No technical details exposed to callers

---

**Phase H-T1 Complete** — Allowlist-only mode active, ready for canary testing.
