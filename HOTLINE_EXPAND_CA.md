# Phase H-T3 — Hotline Canada-Only Expansion

**Status**: ⏳ READY (NOT ENABLED)  
**Date**: 2025-10-01  
**Phase**: H-T3 — Expand to Canada-origin calls with allowlist bypass

---

## Overview

This phase expands hotline access to all Canada-origin calls while maintaining the allowlist as a bypass mechanism. Recording remains OFF. Rate limiting and friendly 429 messages are active.

---

## Prerequisites

- ✅ Phase H-T1 complete (allowlist configured)
- ✅ Phase H-T2 complete (security verified)
- ✅ Stable call flow observed for allowlisted numbers
- ✅ No critical issues in security logs

---

## Configuration Changes

### Enable Canada-Only Mode

```sql
-- Enable geo-filtering with Canada-only mode
UPDATE public.hotline_geo_config 
SET value = true, updated_at = NOW() 
WHERE key = 'geo_filtering_enabled';

UPDATE public.hotline_geo_config 
SET value = true, updated_at = NOW() 
WHERE key = 'canada_only_mode';
```

### Verify Configuration

```sql
-- View current geo config
SELECT * FROM public.hotline_geo_config;

-- Expected output:
-- geo_filtering_enabled: true
-- canada_only_mode: true
-- allowed_country_codes: ["1"]
```

---

## Call Flow (Canada-Only Mode)

```
1. Incoming Call → Twilio Webhook
   ↓
2. Security Gate (Signature Validation)
   ↓
3. Rate Limit Check (per-ANI, per-IP)
   ↓
4. Allowlist Check
   - ✅ If on allowlist → BYPASS geo check, continue to IVR
   - ❌ If NOT on allowlist → Continue to geo check
   ↓
5. ✅ GEO CHECK (NEW)
   - Extract country code (+1) and area code (403, 780, etc.)
   - If Canadian area code → Continue to IVR
   - If non-Canadian → Reject with friendly message
   ↓
6. Language Selection (EN/FR-CA)
   ↓
7. Consent Gate (recording OFF)
   ↓
8. IVR Menu (DTMF: 1=Support, 2=Sales)
   ↓
9. Route to Handler or Voicemail
```

---

## Canadian Area Codes (Supported)

### Alberta
- 403, 587, 780, 825

### Other Provinces
- 204, 226, 236, 249, 250 (BC, MB, ON)
- 289, 306, 343, 365, 367, 368 (ON, SK)
- 382, 416, 418, 431, 437, 438 (ON, QC)
- 450, 506, 514, 519, 548, 579 (QC, NB, ON)
- 581, 604, 613, 639, 647, 672 (QC, BC, ON, SK)
- 705, 709, 778, 782, 807, 819 (ON, NL, BC, NS)
- 825, 867, 873, 902, 905 (AB, YT/NT/NU, QC, NS, ON)

**Note**: This is a simplified check. Production should use a comprehensive area code database with proper validation.

---

## Test Scenarios

### Scenario 1: Canadian Caller (Alberta)

**Input**:
```json
{
  "CallSid": "CA_test_alberta_001",
  "From": "+14035551234",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Expected**:
- ✅ Signature validated
- ✅ Rate limit check passed
- ✅ NOT on allowlist (proceed to geo check)
- ✅ Canadian area code (403) detected
- ✅ Language selection presented

**Logs**:
```
✅ Signature validated
✅ Rate limit: 1/5 (minute)
ℹ️ Not on allowlist, checking geo
✅ Geo check: canada_origin (area code 403)
✅ Presenting language selection
```

---

### Scenario 2: Canadian Caller (Other Province)

**Input**:
```json
{
  "CallSid": "CA_test_toronto_001",
  "From": "+14161234567",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Expected**:
- ✅ Signature validated
- ✅ Rate limit check passed
- ✅ NOT on allowlist (proceed to geo check)
- ✅ Canadian area code (416) detected
- ✅ Language selection presented

---

### Scenario 3: US Caller (Non-Canadian)

**Input**:
```json
{
  "CallSid": "CA_test_us_001",
  "From": "+12125551234",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Expected**:
- ✅ Signature validated
- ✅ Rate limit check passed
- ✅ NOT on allowlist (proceed to geo check)
- ❌ Non-Canadian area code (212 - New York)
- ❌ Friendly rejection message

**Response (TwiML)**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    This service is not available in your region at this time. Goodbye.
  </Say>
  <Hangup/>
</Response>
```

**Logs**:
```
✅ Signature validated
✅ Rate limit: 1/5 (minute)
ℹ️ Not on allowlist, checking geo
❌ Geo check failed: non_canada_restricted (area code 212)
🚫 Access denied (geo-restricted)
```

---

### Scenario 4: Allowlisted Caller (Bypass Geo Check)

**Input**:
```json
{
  "CallSid": "CA_test_allowlist_bypass_001",
  "From": "+12125551234",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Note**: This number is on the allowlist, even though it's a US number.

**Expected**:
- ✅ Signature validated
- ✅ Rate limit check passed
- ✅ ON allowlist (BYPASS geo check)
- ✅ Language selection presented

**Logs**:
```
✅ Signature validated
✅ Rate limit: 1/5 (minute)
✅ Allowlisted number: +12125551234
✅ Geo check bypassed (allowlist)
✅ Presenting language selection
```

---

## Rate Limiting & Friendly 429 Messages

### English (EN)

```xml
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    We're currently experiencing high call volume. Please try again in a few minutes. Thank you for your patience.
  </Say>
  <Hangup/>
</Response>
```

### French (FR-CA)

```xml
<Response>
  <Say voice="Polly.Chantal" language="fr-CA">
    Nous connaissons actuellement un volume d'appels élevé. Veuillez réessayer dans quelques minutes. Merci de votre patience.
  </Say>
  <Hangup/>
</Response>
```

---

## Monitoring Queries

### View Geo-Blocked Attempts

```sql
-- Recent geo-blocked calls
SELECT 
  created_at,
  alert_type,
  event_data->>'from_number_hash' as ani_hash,
  event_data->>'reason' as block_reason,
  event_data->>'area_code' as area_code,
  event_data->>'country_code' as country_code
FROM public.security_alerts
WHERE alert_type = 'hotline_geo_blocked'
ORDER BY created_at DESC
LIMIT 20;
```

### View Canadian Call Activity

```sql
-- Canadian calls (past 24 hours)
SELECT 
  COUNT(*) as total_calls,
  COUNT(DISTINCT ani_hash) as unique_callers,
  COUNT(*) FILTER (WHERE consent_given = true) as consented,
  COUNT(*) FILTER (WHERE route_taken IS NOT NULL) as routed
FROM public.hotline_call_sessions
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Geo-Filtering Stats

```sql
-- Geo-filtering effectiveness
SELECT 
  COUNT(*) FILTER (WHERE event_data->>'reason' = 'canada_origin') as canada_allowed,
  COUNT(*) FILTER (WHERE event_data->>'reason' = 'non_canada_restricted') as non_canada_blocked,
  COUNT(*) FILTER (WHERE event_data->>'reason' = 'geo_filtering_disabled') as geo_disabled
FROM public.security_alerts
WHERE alert_type = 'hotline_geo_blocked'
AND created_at > NOW() - INTERVAL '7 days';
```

---

## Security Validation

### ✅ Geo-Filtering Active
- [ ] Canadian area codes allowed
- [ ] Non-Canadian area codes rejected
- [ ] Allowlist bypass works (non-Canadian allowlisted numbers proceed)
- [ ] Geo-blocks logged to security_alerts

### ✅ Rate Limiting
- [ ] Per-ANI limits enforced (5/min, 15/hour, 50/day)
- [ ] Per-IP limits enforced (20/min, 100/hour, 500/day)
- [ ] Friendly 429 messages (EN/FR-CA)
- [ ] Exponential backoff working (60s → 5m → 15m → 1h)

### ✅ Audit Logging
- [ ] All calls logged to hotline_call_sessions
- [ ] Geo-blocks logged to security_alerts
- [ ] Rate limit violations logged
- [ ] Consent decisions logged

---

## Rollback Procedure

```sql
-- Disable Canada-only mode (revert to allowlist-only)
UPDATE public.hotline_geo_config 
SET value = false, updated_at = NOW() 
WHERE key = 'geo_filtering_enabled';

-- Or disable entire hotline
-- (Set HOTLINE_ENABLED=false in environment)
```

---

## Known Limitations

1. **Area code database**: Simplified Canadian area code list (should use full database in production)
2. **Mobile number portability**: Area codes may not reflect actual location
3. **VoIP numbers**: May not have traditional area codes
4. **False positives**: Some valid Canadian callers may have non-Canadian area codes

---

## Next Steps (Before H-T4)

1. ⏳ Enable geo-filtering with Canada-only mode
2. ⏳ Make test calls from various Canadian area codes
3. ⏳ Make test calls from US numbers (verify rejection)
4. ⏳ Verify allowlist bypass works for non-Canadian numbers
5. ⏳ Monitor geo-block logs for patterns
6. ⏳ Confirm rate limiting and 429 messages working
7. ⏳ Review 24-hour stability report

---

**Phase H-T3 Complete** — Canada-only expansion ready, awaiting stakeholder approval for activation.
