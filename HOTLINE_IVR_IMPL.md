# Phase H-I2 — IVR Engine Implementation

## Objective
Implement IVR engine per HOTLINE_FLOW.md with greeting, keypad routing (Support/Sales), handler logic, and voicemail fallback using DTMF input. Feature-flagged with HOTLINE_ENABLED=false by default.

## Status: ✅ IMPLEMENTED (FEATURE FLAG OFF)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Incoming Call → Security Gate (Phase H-I1)                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Feature Flag Check: HOTLINE_ENABLED?                       │
│  ├─ false → Service Unavailable (503)                       │
│  └─ true  → Continue                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Greeting + Consent Gate (Phase H-I3)                       │
│  "Press 1 to consent, Press 9 to opt out"                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├─ DTMF: 1 → Consent Granted
                  ├─ DTMF: 9 → Opt Out (Hangup)
                  └─ Timeout  → Hangup
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  IVR Menu                                                    │
│  "For support press 1, For sales press 2"                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├─ DTMF: 1 → Support Queue
                  ├─ DTMF: 2 → Sales Queue
                  └─ Timeout  → Voicemail Fallback
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Route Handler                                               │
│  ├─ Dial support number (30s timeout)                       │
│  ├─ Dial sales number (30s timeout)                         │
│  └─ On no answer → Voicemail Fallback                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Voicemail Fallback                                          │
│  ├─ Recording ENABLED  → Record message (max 60s)           │
│  └─ Recording DISABLED → Thank caller (no recording)        │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Components

### 1. Entry Point: hotline-ivr-answer

**File:** `supabase/functions/hotline-ivr-answer/index.ts`

**Responsibilities:**
- Security validation (Phase H-I1)
- Feature flag check (HOTLINE_ENABLED)
- Rate limit enforcement (Phase H-I4)
- Language detection (EN vs FR-CA)
- Call session initialization
- Greeting + consent gate generation

**Key Logic:**
```typescript
// Feature flag gate
if (!HOTLINE_ENABLED) {
  return new Response(serviceUnavailableTwiML, { status: 503 });
}

// Security validation
if (!validateTwilioSignature(...)) {
  return new Response('Forbidden', { status: 403 });
}

// Rate limiting
const rateLimitResult = await checkRateLimit(aniHash, ipHash);
if (!rateLimitResult.allowed) {
  return new Response(rateLimitTwiML, { status: 429 });
}

// Generate greeting with consent gate
return generateGreetingWithConsent(callSid, language);
```

### 2. Consent Handler: hotline-consent-handler

**File:** `supabase/functions/hotline-consent-handler/index.ts`

**Responsibilities:**
- Process DTMF input (1 = consent, 9 = opt-out)
- Log consent decision to audit table
- Route to IVR menu or terminate call

**DTMF Mapping:**
- `1` → Consent granted → Proceed to IVR menu
- `9` → Opt-out → Thank caller and hangup
- Other/Timeout → Invalid input → Hangup

**Key Logic:**
```typescript
if (digits === '1') {
  // Log consent granted
  await logConsent(callSid, 'granted');
  // Generate IVR menu
  return generateIVRMenu(callSid, language);
}

if (digits === '9') {
  // Log opt-out
  await logConsent(callSid, 'denied');
  // Thank and hangup
  return generateOptOutMessage(language);
}

// Invalid or timeout
await logConsent(callSid, 'timeout');
return generateTimeoutMessage(language);
```

### 3. IVR Menu (Embedded in Consent Handler)

**Generation Function:** `generateIVRMenu()`

**Menu Options:**
- **Option 1:** Support (Technical assistance)
- **Option 2:** Sales (Sales inquiries)
- **Timeout:** 10 seconds → Redirect to voicemail

**TwiML Structure:**
```xml
<Response>
  <Gather action="[route-handler-url]" timeout="10" numDigits="1">
    <Say>For support, press 1. For sales, press 2.</Say>
  </Gather>
  <Say>We did not receive your selection. Redirecting to voicemail.</Say>
  <Redirect>[voicemail-url]</Redirect>
</Response>
```

### 4. Route Handler: hotline-route-handler

**File:** `supabase/functions/hotline-route-handler/index.ts`

**Responsibilities:**
- Process IVR menu selection (DTMF 1 or 2)
- Dial appropriate destination number
- Log routing decision
- Fallback to voicemail on timeout/no answer

**DTMF Mapping:**
- `1` → Dial support number
- `2` → Dial sales number
- Other/Timeout → Redirect to voicemail

**Dial Configuration:**
- Timeout: 30 seconds
- Action on no answer: Redirect to voicemail
- Target number: From `BUSINESS_TARGET_E164` environment variable

**Key Logic:**
```typescript
if (digits === '1') {
  await logRoute(callSid, 'support');
  return generateSupportDialTwiML(language);
}

if (digits === '2') {
  await logRoute(callSid, 'sales');
  return generateSalesDialTwiML(language);
}

// Invalid or timeout
await logRoute(callSid, 'voicemail');
return redirectToVoicemail(callSid, language);
```

### 5. Voicemail Fallback: hotline-voicemail

**File:** `supabase/functions/hotline-voicemail/index.ts`

**Responsibilities:**
- Play voicemail greeting
- Record message (if HOTLINE_RECORDING_ENABLED=true)
- Skip recording (if HOTLINE_RECORDING_ENABLED=false)
- Thank caller and hangup

**Recording Behavior:**
- **Enabled:** Record up to 60 seconds with transcription
- **Disabled:** Play greeting only, no recording

**Key Logic:**
```typescript
if (HOTLINE_RECORDING_ENABLED) {
  return `
    <Say>Please leave a message after the tone.</Say>
    <Record maxLength="60" transcribe="true" />
    <Say>Thank you for your message. Goodbye.</Say>
  `;
} else {
  return `
    <Say>Please leave a message after the tone.</Say>
    <Pause length="1"/>
    <Say>Thank you. Goodbye.</Say>
  `;
}
```

## Feature Flags

### HOTLINE_ENABLED (Default: false)

**Purpose:** Master on/off switch for entire hotline system

**Values:**
- `false` (default) → Service unavailable message (503)
- `true` → Full IVR system active

**Location:** Supabase secrets / environment variables

**Behavior When Disabled:**
```xml
<Response>
  <Say>This service is currently unavailable. Please try again later.</Say>
  <Hangup/>
</Response>
```

### HOTLINE_RECORDING_ENABLED (Default: false)

**Purpose:** Enable/disable voicemail recording

**Values:**
- `false` (default) → No recording, greeting only
- `true` → Record voicemail messages

**Location:** Supabase secrets / environment variables

**Compliance:** Aligns with Phase H-I3 consent requirements

## Language Support

### Supported Languages
1. **English (en)** - Default
2. **French Canadian (fr-CA)** - Auto-detected for CA calls

### Detection Logic
```typescript
const language = params.ToCountry === 'CA' ? 'fr-CA' : 'en';
```

### TwiML Language Codes
- English: `en-US`
- French Canadian: `fr-CA`

### All User-Facing Messages
- Greeting ✅
- Consent prompt ✅
- IVR menu ✅
- Routing confirmation ✅
- Voicemail prompt ✅
- Error messages ✅

## Database Integration

### Tables Used

1. **hotline_call_sessions**
   - Tracks call state (in-progress, completed, failed)
   - Records route taken (support, sales, voicemail)
   - Stores consent status

2. **hotline_consent_audit**
   - Logs consent decisions
   - Records DTMF input
   - Timestamps all consent events

3. **hotline_rate_limit_ani**
   - Tracks per-phone-number rate limits
   - Enforced before IVR logic

4. **hotline_rate_limit_ip**
   - Tracks per-IP rate limits
   - Enforced before IVR logic

### Session Lifecycle

```
1. Call initiated → Create session (status: in-progress)
2. Consent granted → Update consent_given=true
3. Route selected → Update route_taken='support'|'sales'|'voicemail'
4. Call completed → Update status='completed', completed_at=NOW()
```

## Call Flow Paths

### Path 1: Support Route (Happy Path)
```
1. Incoming call → Security gate ✅
2. Rate limit check ✅
3. Greeting → Consent prompt (DTMF 1) ✅
4. IVR menu → Support (DTMF 1) ✅
5. Dial support number (30s timeout)
6. If answered → Connected to support
7. If no answer → Voicemail fallback
```

### Path 2: Sales Route (Happy Path)
```
1. Incoming call → Security gate ✅
2. Rate limit check ✅
3. Greeting → Consent prompt (DTMF 1) ✅
4. IVR menu → Sales (DTMF 2) ✅
5. Dial sales number (30s timeout)
6. If answered → Connected to sales
7. If no answer → Voicemail fallback
```

### Path 3: Voicemail Fallback (Timeout)
```
1. Incoming call → Security gate ✅
2. Rate limit check ✅
3. Greeting → Consent prompt (timeout) → Hangup
   OR
3. Greeting → Consent prompt (DTMF 1) ✅
4. IVR menu → Timeout (no DTMF) → Voicemail
5. Play voicemail greeting
6. Record message (if enabled) or just thank caller
7. Hangup
```

### Path 4: Opt-Out
```
1. Incoming call → Security gate ✅
2. Rate limit check ✅
3. Greeting → Consent prompt (DTMF 9) 
4. "You have opted out. Thank you. Goodbye."
5. Hangup
```

### Path 5: Rate Limited
```
1. Incoming call → Security gate ✅
2. Rate limit check ❌ (limit exceeded)
3. "Too many calls. Please try again later." (429)
4. Hangup
```

### Path 6: Feature Disabled
```
1. Incoming call → Feature flag check ❌
2. "Service currently unavailable." (503)
3. Hangup
```

## Error Handling

### Edge Function Errors
- All errors caught and logged
- Graceful degradation with error TwiML
- Generic error message to caller
- No sensitive details exposed

**Error Response:**
```xml
<Response>
  <Say>We apologize, but we are experiencing technical difficulties.</Say>
  <Hangup/>
</Response>
```

### Database Errors
- Non-blocking: Call continues even if logging fails
- Errors logged to console for debugging
- Retry logic not implemented (fail gracefully)

### Twilio API Errors
- Handled by Twilio (automatic retries)
- Status callbacks logged via voice-status endpoint

## Performance Considerations

### Latency Targets
- Security validation: <50ms
- Rate limit check: <100ms
- Database logging: <200ms (non-blocking)
- Total response time: <500ms

### Scalability
- Edge functions auto-scale with Supabase
- Database queries optimized with indexes
- Rate limiting prevents abuse

### Monitoring
- Console logs for all key events
- Database audit trail for forensics
- Twilio status callbacks for call analytics

## Testing Strategy (Phase H-I5)

### Unit Tests (Mocked)
- [ ] Feature flag disabled → 503 response
- [ ] Security validation failure → 403 response
- [ ] Rate limit exceeded → 429 response
- [ ] Consent granted (DTMF 1) → IVR menu
- [ ] Consent denied (DTMF 9) → Hangup
- [ ] Support route (DTMF 1) → Dial support
- [ ] Sales route (DTMF 2) → Dial sales
- [ ] IVR timeout → Voicemail
- [ ] Recording enabled → Record TwiML
- [ ] Recording disabled → No record TwiML

### Integration Tests (Twilio Sandbox)
- [ ] End-to-end support path
- [ ] End-to-end sales path
- [ ] End-to-end voicemail path
- [ ] Language detection (EN vs FR-CA)
- [ ] Consent opt-out flow

### Load Tests
- [ ] 50 concurrent calls
- [ ] Rate limiting under load
- [ ] Database performance under load

## Configuration Requirements

### Environment Variables (Supabase Secrets)

**Required:**
- `TWILIO_AUTH_TOKEN` - For signature validation ✅
- `TWILIO_ACCOUNT_SID` - For Twilio API calls ✅
- `SUPABASE_URL` - For edge function URLs ✅
- `SUPABASE_SERVICE_ROLE_KEY` - For database access ✅
- `BUSINESS_TARGET_E164` - Support/sales phone number ✅

**Optional (Feature Flags):**
- `HOTLINE_ENABLED` - Default: `false` ✅
- `HOTLINE_RECORDING_ENABLED` - Default: `false` ✅

### Twilio Configuration

**Phone Number Settings:**
1. Voice Webhook URL: `[SUPABASE_URL]/functions/v1/hotline-ivr-answer`
2. HTTP Method: `POST`
3. Status Callback URL: `[SUPABASE_URL]/functions/v1/voice-status`

## Security Considerations

1. **Feature Flag Default:** OFF (safe by default)
2. **Recording Default:** OFF (privacy by default)
3. **Signature Validation:** Always enforced
4. **Rate Limiting:** Always enforced
5. **Consent Required:** Before any call processing
6. **Data Hashing:** All phone numbers hashed in database

## Compliance Alignment

- **PIPEDA/PIPA:** Consent gate before any recording
- **SOC 2:** Audit logging of all call events
- **WCAG AA:** Not applicable (voice-only interface)

## Known Limitations

1. **No Speech Recognition:** DTMF-only (speech is optional future enhancement)
2. **No Call Queue:** Direct dial to target number
3. **No Agent Availability Check:** Always attempts to dial
4. **Single Target Number:** All support/sales go to same number (can be enhanced)

## Integration with Other Phases

- **Phase H-I1:** Security gate applied before IVR logic ✅
- **Phase H-I3:** Consent gate integrated into greeting ✅
- **Phase H-I4:** Rate limiting enforced before IVR ✅
- **Phase H-I5:** Test scenarios defined for all paths
- **Phase H-I6:** Environment variables documented
- **Phase H-I7:** Acceptance criteria defined

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-31 | AI Assistant | Initial IVR implementation documentation |

---

## Status: ✅ IMPLEMENTED (FEATURE FLAG OFF)

**Date:** 2025-01-31  
**Phase:** H-I2 Complete  
**Feature Flag:** HOTLINE_ENABLED=false (safe default)  
**Next Phase:** H-I3 (Consent Gate Implementation) - Already integrated

**IVR engine implemented and ready for testing. System remains disabled by default for safety.**
