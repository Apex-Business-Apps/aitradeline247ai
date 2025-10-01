# Phase H-T2 — Hotline Security Verification (Live Probe)

**Status**: ⏳ PENDING EXECUTION  
**Date**: 2025-10-01  
**Phase**: H-T2 — Verify webhook security with live test call

---

## Overview

This phase verifies that the webhook security layer (Twilio signature validation) is properly enforced using a single, low-traffic test call from an allowlisted number.

---

## Prerequisites

- ✅ Phase H-T1 complete (allowlist configured)
- ✅ `HOTLINE_ENABLED=true` in environment
- ✅ At least one test number in allowlist
- ✅ Twilio webhook URL configured to point to `hotline-ivr-answer`

---

## Security Verification Steps

### 1. Configure Twilio Webhook

**Twilio Console → Phone Numbers → Your Number → Voice Configuration**

Set the webhook URL:
```
https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/hotline-ivr-answer
```

**HTTP Method**: POST  
**Primary Handler**: This URL  
**Fallback URL**: (Optional) Same URL for redundancy

---

### 2. Make Test Call (Allowlisted Number)

**Test Scenario 1: Valid Signature**

1. Call your Twilio number from an allowlisted phone
2. Expected outcome:
   - Call is answered
   - Language selection prompt plays
   - Consent/IVR flow continues

**Logs to Check**:
```
✅ Signature validated
✅ Allowlisted number: +15878839797
✅ Rate limit check passed
✅ IVR flow started
```

---

### 3. Simulate Invalid Signature (Manual)

**Using curl (for debugging only)**:

```bash
# This will fail signature validation (no valid signature header)
curl -X POST \
  https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/hotline-ivr-answer \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=CA_test_invalid&From=+15878839797&To=+15551234567&CallStatus=ringing"
```

**Expected Response**: HTTP 403 Forbidden

**Logs to Check**:
```
❌ Invalid Twilio signature
🚫 Request rejected (403)
```

---

## Security Checklist

### ✅ Signature Validation
- [ ] Valid signature allows call through
- [ ] Invalid signature returns 403
- [ ] Missing signature returns 403
- [ ] Signature mismatch logged to security_alerts

### ✅ Rate Limiting
- [ ] Per-ANI limits enforced (5/min, 15/hour, 50/day)
- [ ] Per-IP limits enforced (20/min, 100/hour, 500/day)
- [ ] Rate limit violations return friendly 429 message
- [ ] Rate limit violations logged with anonymized data

### ✅ Allowlist Enforcement
- [ ] Allowlisted numbers proceed to IVR
- [ ] Non-allowlisted numbers rejected with friendly message
- [ ] All calls logged to hotline_call_sessions
- [ ] Rejection attempts logged to security_alerts

### ✅ Audit Logging
- [ ] All calls logged with anonymized ANI (SHA256)
- [ ] Consent decisions logged to hotline_consent_audit
- [ ] Security events logged to security_alerts
- [ ] No PII in logs (except in encrypted fields)

---

## Monitoring Queries

### Verify Signature Validation

```sql
-- View signature validation failures
SELECT 
  created_at,
  alert_type,
  event_data->>'call_sid' as call_sid,
  event_data->>'reason' as reason,
  severity
FROM public.security_alerts
WHERE alert_type = 'hotline_signature_invalid'
ORDER BY created_at DESC
LIMIT 20;
```

### Verify Rate Limiting

```sql
-- View rate limit violations (ANI)
SELECT 
  ani_hash,
  window_start,
  request_count,
  block_until,
  block_count
FROM public.hotline_rate_limit_ani
WHERE block_until > NOW()
ORDER BY window_start DESC;

-- View rate limit violations (IP)
SELECT 
  ip_hash,
  window_start,
  request_count,
  block_until,
  block_count
FROM public.hotline_rate_limit_ip
WHERE block_until > NOW()
ORDER BY window_start DESC;
```

### View Call Sessions

```sql
-- Recent call sessions
SELECT 
  call_sid,
  ani_hash,
  call_status,
  consent_given,
  route_taken,
  language,
  created_at,
  completed_at
FROM public.hotline_call_sessions
ORDER BY created_at DESC
LIMIT 20;
```

---

## Edge Function Logs

### View Real-Time Logs

**Supabase Dashboard → Edge Functions → hotline-ivr-answer → Logs**

Or via CLI:
```bash
supabase functions logs hotline-ivr-answer --tail
```

**Expected Log Patterns**:

✅ **Valid Call**:
```
[INFO] Incoming call: CA1234567890abcdef
[INFO] Signature validated
[INFO] Allowlisted number: +15878839797
[INFO] Rate limit check: 1/5 (minute)
[INFO] Presenting language selection
```

❌ **Invalid Signature**:
```
[ERROR] Invalid Twilio signature
[ERROR] Request rejected (403)
```

❌ **Rate Limited**:
```
[WARN] Rate limit exceeded: ANI 5/5 (minute)
[WARN] Returning 429 (too many requests)
```

---

## Test Cases

### Test Case 1: Valid Call (Happy Path)

**Input**:
- Allowlisted number: +15878839797
- Valid Twilio signature
- First call of the day

**Expected**:
- ✅ Signature validated
- ✅ Rate limit check passed
- ✅ Language selection presented
- ✅ Call logged to hotline_call_sessions

---

### Test Case 2: Invalid Signature

**Input**:
- Any number
- Invalid or missing signature

**Expected**:
- ❌ 403 Forbidden response
- ❌ Security alert logged
- ❌ No IVR flow started

---

### Test Case 3: Non-Allowlisted Number

**Input**:
- Non-allowlisted number: +14161234567
- Valid Twilio signature

**Expected**:
- ✅ Signature validated
- ❌ Allowlist check failed
- ❌ Friendly rejection message
- ✅ Rejection logged to security_alerts

---

### Test Case 4: Rate Limited

**Input**:
- Allowlisted number
- 6th call in 1 minute (exceeds burst limit)

**Expected**:
- ✅ Signature validated
- ❌ Rate limit exceeded
- ❌ 429 response with friendly message (EN/FR-CA)
- ✅ Rate limit violation logged

---

## Known Limitations

1. **Signature validation requires Twilio**: Cannot be fully tested without live Twilio webhook
2. **Network-dependent**: Requires internet connectivity and Twilio service availability
3. **Edge function cold starts**: First call may have ~1-2s latency

---

## Failure Scenarios & Responses

### Scenario 1: Upstream Twilio Unavailable

**Symptoms**:
- Calls not reaching webhook
- Timeout errors in Twilio console

**Response**:
- ⚠️ BLOCKED BY UPSTREAM - Cannot proceed
- Document issue in this file
- Retry after Twilio service restored

---

### Scenario 2: Supabase Edge Function Down

**Symptoms**:
- 500/503 errors in Twilio console
- Edge function logs show errors

**Response**:
- Check Supabase status page
- Review edge function logs
- Rollback if necessary (set HOTLINE_ENABLED=false)

---

### Scenario 3: Database Connection Issues

**Symptoms**:
- Calls connect but fail during allowlist check
- "Database connection failed" in logs

**Response**:
- Check Supabase database status
- Verify service role key is correct
- Check database connection pool limits

---

## Success Criteria

- [ ] Test call from allowlisted number completes full IVR flow
- [ ] Invalid signature attempts return 403
- [ ] Rate limiting works as expected
- [ ] All security layers active and logging correctly
- [ ] No PII leakage in logs or error messages
- [ ] Friendly rejection messages for non-allowlisted numbers

---

## Next Steps (Before H-T3)

1. ⏳ Execute test call from allowlisted number
2. ⏳ Verify signature validation in logs
3. ⏳ Test invalid signature (manual curl test)
4. ⏳ Test rate limiting (6+ calls in 1 minute)
5. ⏳ Test non-allowlisted number rejection
6. ⏳ Review all audit logs for completeness
7. ⏳ Document any issues or blockers

---

**Phase H-T2 Status**: Ready for live security verification once Twilio webhook is configured.
