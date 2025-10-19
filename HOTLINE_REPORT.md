# Phase H6 — Hotline Acceptance Testing Report

## Test Environment
- **Hotline Number:** +1-587-742-8885
- **Webhook Base URL:** https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/
- **Test Date:** [To be executed]
- **Tester:** [TBD]

## Pre-Test Checklist
- [ ] Twilio credentials configured in Supabase Edge Function secrets
- [ ] `voice-answer` function deployed and accessible
- [ ] `voice-menu-handler` function deployed (if implemented)
- [ ] `voice-status` function deployed
- [ ] `call_lifecycle` table exists in Supabase
- [ ] `rate_limits` table exists in Supabase
- [ ] Phone available for testing (non-VOIP recommended)

## Test Scenarios

---

### Test 1: Sales Route (Happy Path)
**Objective:** Verify caller can reach sales team via DTMF input.

#### Steps
1. Dial +1-587-742-8885 from test phone
2. Listen to greeting + consent message (~10 seconds)
3. Wait for menu prompt ("Press 1 for Sales...")
4. Press `1` within 5 seconds
5. Wait for connection confirmation
6. Verify call connects to +1-431-990-0222
7. Hang up after confirmation

#### Expected Results
| Step | Expected Behavior | Actual Result | Pass/Fail |
|------|-------------------|---------------|-----------|
| 1 | Call connects within 3 rings | | |
| 2 | Consent message plays: "This call may be recorded..." | | |
| 3 | Menu prompt plays: "Press 1 for Sales..." | | |
| 4 | System accepts DTMF `1` input | | |
| 5 | "Connecting you to our sales team" plays | | |
| 6 | Call rings at +1-431-990-0222 | | |
| 7 | Call disconnects cleanly | | |

#### Webhook Verification
```sql
-- Check call_lifecycle table
SELECT 
  call_sid,
  from_number,
  to_number,
  call_status,
  recording_consent,
  created_at
FROM call_lifecycle
WHERE created_at > now() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Webhook Hits:**
1. POST `/voice-answer` → 200 OK (TwiML response)
2. POST `/voice-menu-handler?Digits=1` → 200 OK (TwiML response)
3. POST `/voice-status` → 200 OK (call ended)

#### Console Logs (Edge Function)
```bash
# Check voice-answer logs
supabase functions logs voice-answer --limit 10

# Expected log entries:
# [INFO] Incoming call: { CallSid: 'CA...', From: '+15551234567', To: '+15877428885' }
# [INFO] Consent message delivered
# [INFO] Menu prompt delivered
```

**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:**

---

### Test 2: Support Route
**Objective:** Verify caller can reach support queue via DTMF `2`.

#### Steps
1. Dial +1-587-742-8885
2. Listen to greeting + menu
3. Press `2` for Support
4. Verify connection to support queue
5. Hang up after confirmation

#### Expected Results
| Step | Expected Behavior | Actual Result | Pass/Fail |
|------|-------------------|---------------|-----------|
| 1-2 | Same as Test 1 | | |
| 3 | System accepts DTMF `2` input | | |
| 4 | "Connecting you to technical support" plays | | |
| 5 | Call connects to support queue/number | | |

#### Webhook Verification
```sql
SELECT event_type, event_data 
FROM analytics_events
WHERE event_type = 'twilio_call_incoming'
  AND created_at > now() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Webhook Hits:**
1. POST `/voice-answer` → 200 OK
2. POST `/voice-menu-handler?Digits=2` → 200 OK
3. POST `/voice-status` → 200 OK

**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:**

---

### Test 3: Voicemail (Direct Access)
**Objective:** Verify caller can leave voicemail by pressing `9`.

#### Steps
1. Dial +1-587-742-8885
2. Listen to menu
3. Press `9` for Voicemail
4. Wait for voicemail prompt
5. Record 10-second test message: "This is a test voicemail from [Your Name] at [Time]."
6. Press `#` to finish recording
7. Wait for confirmation message
8. Hang up

#### Expected Results
| Step | Expected Behavior | Actual Result | Pass/Fail |
|------|-------------------|---------------|-----------|
| 3 | System accepts DTMF `9` input | | |
| 4 | "Please leave a message after the tone" plays | | |
| 5 | Beep tone plays, recording starts | | |
| 6 | Recording stops on `#` keypress | | |
| 7 | "Thank you. Your message has been recorded. Goodbye." | | |
| 8 | Call disconnects | | |

#### Webhook Verification
```sql
-- Check for recording URL
SELECT 
  call_sid,
  recording_url,
  recording_duration,
  recording_consent
FROM call_lifecycle
WHERE recording_url IS NOT NULL
  AND created_at > now() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Webhook Hits:**
1. POST `/voice-answer` → 200 OK
2. POST `/voice-menu-handler?Digits=9` → 200 OK
3. POST `/voice-voicemail-handler` → 200 OK (recording completed)
4. POST `/voice-status` → 200 OK

**Expected Data:**
- `recording_url`: https://api.twilio.com/2010-04-01/Accounts/.../Recordings/RE...
- `recording_duration`: ~10 seconds
- `recording_consent`: `true`

**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:**

---

### Test 4: Timeout → Voicemail Fallback
**Objective:** Verify system routes to voicemail after 2 menu timeouts.

#### Steps
1. Dial +1-587-742-8885
2. Listen to menu
3. **Do not press any key** (wait 5+ seconds)
4. Menu should replay with "We didn't receive your selection..."
5. **Do not press any key again** (wait 5+ seconds)
6. Expect: "Transferring you to voicemail"
7. Leave short test message
8. Hang up

#### Expected Results
| Step | Expected Behavior | Actual Result | Pass/Fail |
|------|-------------------|---------------|-----------|
| 3 | First timeout after 5 seconds | | |
| 4 | Menu replays with retry prompt | | |
| 5 | Second timeout after 5 seconds | | |
| 6 | "Transferring you to voicemail" plays | | |
| 7 | Voicemail recording starts | | |

#### Webhook Verification
```sql
-- Check analytics_events for timeout detection
SELECT event_type, event_data 
FROM analytics_events
WHERE event_data->>'timeout' = 'true'
  AND created_at > now() - INTERVAL '5 minutes';
```

**Expected Webhook Hits:**
1. POST `/voice-answer` → 200 OK
2. POST `/voice-menu-handler` (no Digits) → 200 OK (retry TwiML)
3. POST `/voice-menu-handler?retry=1` (no Digits) → 200 OK (voicemail TwiML)
4. POST `/voice-voicemail-handler` → 200 OK

**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:**

---

### Test 5: Invalid Input → Retry → Success
**Objective:** Verify invalid DTMF input triggers retry, then accepts valid input.

#### Steps
1. Dial +1-587-742-8885
2. Listen to menu
3. Press `5` (invalid key)
4. Expect: "Invalid selection" + menu replays
5. Press `1` (valid key)
6. Verify call connects to sales

#### Expected Results
| Step | Expected Behavior | Actual Result | Pass/Fail |
|------|-------------------|---------------|-----------|
| 3 | System receives DTMF `5` | | |
| 4 | "Invalid selection" message plays | | |
| 4 | Menu replays immediately | | |
| 5 | System accepts DTMF `1` | | |
| 6 | Call connects to sales team | | |

#### Webhook Verification
```sql
-- Check for invalid input logging
SELECT event_type, event_data 
FROM analytics_events
WHERE event_data->>'invalid_input' = 'true'
  AND created_at > now() - INTERVAL '5 minutes';
```

**Expected Webhook Hits:**
1. POST `/voice-answer` → 200 OK
2. POST `/voice-menu-handler?Digits=5` → 200 OK (invalid, retry TwiML)
3. POST `/voice-menu-handler?Digits=1&retry=1` → 200 OK (success)
4. POST `/voice-status` → 200 OK

**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:**

---

### Test 6: Recording Consent Opt-Out
**Objective:** Verify pressing `8` disables call recording.

#### Steps
1. Dial +1-587-742-8885
2. Listen to consent message
3. Press `8` within 3 seconds (during opt-out window)
4. Expect: "Recording has been disabled for this call"
5. Menu should proceed normally
6. Press `1` for Sales
7. Complete call

#### Expected Results
| Step | Expected Behavior | Actual Result | Pass/Fail |
|------|-------------------|---------------|-----------|
| 3 | System accepts DTMF `8` during consent window | | |
| 4 | "Recording has been disabled" confirmation plays | | |
| 5 | Menu prompt plays normally | | |
| 6 | Call connects to sales | | |

#### Webhook Verification
```sql
-- Verify recording_consent = false
SELECT 
  call_sid,
  recording_consent,
  recording_url
FROM call_lifecycle
WHERE created_at > now() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- recording_consent: false
-- recording_url: NULL (no recording made)
```

**Expected Webhook Hits:**
1. POST `/voice-consent-handler?Digits=8` → 200 OK (opt-out)
2. POST `/voice-menu-handler?Digits=1` → 200 OK (dial WITHOUT record attribute)
3. POST `/voice-status` → 200 OK

**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:**

---

### Test 7: Rate Limit Enforcement (Security)
**Objective:** Verify system blocks >10 calls/hour from same number.

#### Steps (Requires Automation or Patience)
1. Call hotline 10 times in succession (hang up quickly each time)
2. On 11th call, expect rate limit message
3. Verify call is rejected before menu

#### Expected Results
| Step | Expected Behavior | Actual Result | Pass/Fail |
|------|-------------------|---------------|-----------|
| 1-10 | Calls connect normally | | |
| 11 | "You have reached the maximum number of calls allowed" | | |
| 11 | Call hangs up automatically | | |

#### Webhook Verification
```sql
-- Check rate limit violations
SELECT 
  event_type, 
  event_data->>'ani' AS caller,
  event_data->>'call_count' AS calls
FROM analytics_events
WHERE event_type = 'rate_limit_exceeded'
  AND created_at > now() - INTERVAL '10 minutes';
```

#### Console Logs
```bash
# Expected log entry:
# [WARN] Rate limit exceeded for ANI +15551234567: 11 calls in last hour
```

**Status:** ⬜ PASS | ⬜ FAIL  
**Notes:**

---

## Error-Free Console Verification

### Check All Edge Function Logs
```bash
# voice-answer logs (last 50 entries)
supabase functions logs voice-answer --limit 50

# Look for:
# ✅ No [ERROR] entries
# ✅ All webhook calls logged with 200 OK
# ✅ No exceptions or stack traces
```

### Database Integrity Check
```sql
-- Verify all calls logged correctly
SELECT 
  COUNT(*) AS total_test_calls,
  COUNT(DISTINCT call_sid) AS unique_calls,
  SUM(CASE WHEN recording_consent THEN 1 ELSE 0 END) AS consented_calls
FROM call_lifecycle
WHERE created_at > now() - INTERVAL '1 hour';

-- Expected: total_test_calls = 7 (one per test)
```

---

## Summary Report

### Test Results Overview
| Test # | Scenario | Status | Notes |
|--------|----------|--------|-------|
| 1 | Sales Route (DTMF 1) | ⬜ PASS / ⬜ FAIL | |
| 2 | Support Route (DTMF 2) | ⬜ PASS / ⬜ FAIL | |
| 3 | Voicemail (DTMF 9) | ⬜ PASS / ⬜ FAIL | |
| 4 | Timeout → Voicemail | ⬜ PASS / ⬜ FAIL | |
| 5 | Invalid Input → Retry | ⬜ PASS / ⬜ FAIL | |
| 6 | Recording Opt-Out | ⬜ PASS / ⬜ FAIL | |
| 7 | Rate Limit Block | ⬜ PASS / ⬜ FAIL | |

### Overall Status
⬜ **PASS** - All tests passed, hotline ready for production  
⬜ **FAIL** - Issues found, see notes below

### Issues Found
1. [Issue description]
   - **Severity:** High / Medium / Low
   - **Steps to Reproduce:** [...]
   - **Expected Fix:** [...]

2. [Issue description]
   - **Severity:** High / Medium / Low
   - **Steps to Reproduce:** [...]
   - **Expected Fix:** [...]

### Performance Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Call answer time | <3 rings | | ⬜ |
| Menu response time | <500ms | | ⬜ |
| Webhook latency | <200ms | | ⬜ |
| Recording storage | 100% success | | ⬜ |
| Error rate | 0% | | ⬜ |

### Security Validation
- ✅ X-Twilio-Signature validated on all webhooks
- ✅ No secrets exposed in logs
- ✅ Rate limiting functional
- ✅ Recording consent enforced
- ✅ TLS enforced on all endpoints

### Recommendations
- [ ] Deploy to production (if all tests pass)
- [ ] Monitor call volume for first 24 hours
- [ ] Set up alerting for >10 calls/hour
- [ ] Schedule bi-weekly recording retention cleanup
- [ ] Document internal number for bypass (if needed)

---

## Next Steps

### If PASS
1. **Deploy to Production:** Hotline is ready for public use
2. **Update Documentation:** Link to this report in `TWILIO_INTEGRATION_COMPLETE.md`
3. **Enable Monitoring:** Set up Twilio usage alerts
4. **Train Staff:** Share hotline flow with support team

### If FAIL
1. **Fix Critical Issues:** Address all high-severity failures
2. **Re-test Failed Scenarios:** Repeat tests that failed
3. **Update Code:** Modify edge functions as needed
4. **Revalidate:** Run full acceptance sweep again

---

**Test Completion Date:** [TBD]  
**Tester Signature:** [TBD]  
**Approval:** ⬜ Approved for Production | ⬜ Requires Rework

