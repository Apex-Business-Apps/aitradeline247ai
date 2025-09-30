# Phase H4 — Call Recording Consent (PIPEDA/PIPA Compliant)

## Legal Framework (Canada)

### PIPEDA (Federal)
**Personal Information Protection and Electronic Documents Act**
- Applies to: Commercial activities across Canada (except AB, BC, QC in certain cases)
- **Consent Requirement:** Express or implied consent required before recording
- **Notification:** Must inform individuals about recording purpose and retention

### PIPA (Alberta & British Columbia)
**Personal Information Protection Act**
- Applies to: Private sector in AB/BC
- **Similar requirements** to PIPEDA for recording consent

### Key Principles
1. **Consent must be meaningful** - Clear, understandable language
2. **Opt-out must be available** - Individuals can refuse recording
3. **Purpose limitation** - Only use recordings for stated purposes
4. **Retention limits** - Delete recordings when no longer needed

## Consent Script (Pre-Recording)

### Full Consent Message (Initial Greeting)
```xml
<Say voice="Polly.Joanna">
  Thank you for calling TradeLine 24/7. 
  
  This call may be recorded for quality assurance and training purposes. 
  
  By staying on the line, you consent to being recorded. 
  
  To opt out of recording, press 8 now.
</Say>

<Gather action="/voice-consent-handler" 
        method="POST" 
        numDigits="1" 
        timeout="3">
  <Pause length="3"/>
</Gather>
```

**Message Duration:** ~10 seconds
**Opt-out Window:** 3 seconds after message completes

### Consent Elements
✅ **Who:** "TradeLine 24/7"  
✅ **What:** "This call may be recorded"  
✅ **Why:** "for quality assurance and training purposes"  
✅ **How to Consent:** "By staying on the line, you consent"  
✅ **How to Opt-out:** "Press 8 now to opt out"  

## Opt-Out Branch

### User Presses 8 (Opt-Out)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Recording has been disabled for this call. 
    Connecting you now.
  </Say>
  
  <!-- Dial WITHOUT recording -->
  <Dial callerId="+15877428885" action="/voice-status">
    <Number>+14319900222</Number>
  </Dial>
</Response>
```

**Database Log:**
```typescript
await supabase.from('call_lifecycle').insert({
  call_sid: CallSid,
  from_number: From,
  to_number: To,
  recording_consent: false, // User opted out
  recording_url: null,
  consent_timestamp: new Date().toISOString()
});
```

### User Does Nothing (Implied Consent)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Dial WITH recording -->
  <Dial 
    callerId="+15877428885" 
    record="record-from-answer" 
    recordingStatusCallback="/voice-recording-status"
    action="/voice-status"
  >
    <Number>+14319900222</Number>
  </Dial>
</Response>
```

**Database Log:**
```typescript
await supabase.from('call_lifecycle').insert({
  call_sid: CallSid,
  from_number: From,
  to_number: To,
  recording_consent: true, // Implied consent
  recording_url: null, // Will be updated via callback
  consent_timestamp: new Date().toISOString()
});
```

## Recording Storage & Retention

### Supabase Table Schema
```sql
CREATE TABLE call_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT UNIQUE NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  recording_consent BOOLEAN NOT NULL DEFAULT false,
  recording_url TEXT,
  recording_duration INTEGER,
  transcription_text TEXT,
  consent_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days')
);

-- Auto-delete after 90 days
CREATE INDEX idx_expires_at ON call_lifecycle(expires_at);
```

### Recording Callback Handler
```typescript
// supabase/functions/voice-recording-status/index.ts
serve(async (req) => {
  const formData = await req.formData();
  const CallSid = formData.get('CallSid') as string;
  const RecordingUrl = formData.get('RecordingUrl') as string;
  const RecordingDuration = parseInt(formData.get('RecordingDuration') as string);

  // Validate consent before storing URL
  const { data: call } = await supabase
    .from('call_lifecycle')
    .select('recording_consent')
    .eq('call_sid', CallSid)
    .single();

  if (!call?.recording_consent) {
    console.warn(`Recording received for call ${CallSid} without consent - deleting`);
    // Delete recording from Twilio
    await fetch(`${RecordingUrl}.json`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)}`
      }
    });
    return new Response('OK', { status: 200 });
  }

  // Store recording metadata (consent verified)
  await supabase
    .from('call_lifecycle')
    .update({
      recording_url: RecordingUrl,
      recording_duration: RecordingDuration
    })
    .eq('call_sid', CallSid);

  return new Response('OK', { status: 200 });
});
```

## Retention & Deletion Policy

### Automatic Deletion (90 Days)
```sql
-- Scheduled job (run daily)
DELETE FROM call_lifecycle 
WHERE expires_at < now();
```

### Manual Deletion (User Request)
```typescript
// PIPEDA Right to Erasure
async function deleteCallRecording(callSid: string) {
  const { data: call } = await supabase
    .from('call_lifecycle')
    .select('recording_url')
    .eq('call_sid', callSid)
    .single();

  if (call?.recording_url) {
    // Delete from Twilio
    await fetch(`${call.recording_url}.json`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)}`
      }
    });
  }

  // Delete from database
  await supabase
    .from('call_lifecycle')
    .delete()
    .eq('call_sid', callSid);
}
```

## Privacy Policy (Must Include)

### Recording Section
```
Call Recording Policy

TradeLine 24/7 may record phone calls for:
• Quality assurance
• Staff training
• Dispute resolution

You will be notified at the start of each call and given the option 
to opt out of recording by pressing 8. If you do not opt out, we will 
assume your consent.

Recordings are stored securely and deleted after 90 days. You may 
request deletion of your recording at any time by emailing 
privacy@tradeline247ai.com with your call date and phone number.

We do not share recordings with third parties except as required by law.
```

## Compliance Checklist

- ✅ **Pre-recording notification** - Consent message plays before recording starts
- ✅ **Clear opt-out mechanism** - Press 8 to disable recording
- ✅ **Purpose stated** - "quality assurance and training"
- ✅ **Consent logged** - `recording_consent` field in database
- ✅ **Retention limit** - Auto-delete after 90 days
- ✅ **Right to erasure** - Manual deletion function available
- ✅ **Secure storage** - Twilio + Supabase (both SOC 2 compliant)
- ✅ **Privacy policy** - Recording policy published on website

## Edge Cases

### Case 1: Consent Callback Fails
```typescript
// Timeout on gather (no opt-out received) → Proceed with recording
if (!Digits) {
  // Default to recording with implied consent
  return dialWithRecording(CallSid);
}
```

### Case 2: Recording Starts Before Consent
**Solution:** Use `record="record-from-answer"` in `<Dial>`, not in initial `<Response>`.  
Recording only starts AFTER the call is answered by the agent.

### Case 3: Multi-Party Calls (3+ People)
**PIPEDA Requirement:** All parties must be notified and consent.
```xml
<Say>This call may be recorded. All participants consent by staying on the line.</Say>
```

### Case 4: Call Transfer
**Issue:** Does consent carry over to transferred agents?  
**Solution:** Yes, consent applies to the entire call session. No re-prompt needed.

## Testing Scenarios

### Test 1: Opt-Out (Press 8)
```
1. Call +1-587-742-8885
2. Listen to consent message
3. Press 8 within 3 seconds
4. Expect: "Recording has been disabled for this call"
5. Verify: call_lifecycle.recording_consent = false
6. Verify: No recording_url saved
```

### Test 2: Implied Consent (No Action)
```
1. Call hotline
2. Listen to consent message
3. Do not press any key
4. Menu proceeds normally
5. Verify: call_lifecycle.recording_consent = true
6. Verify: recording_url populated after call ends
```

### Test 3: Late Opt-Out (After 3 Seconds)
```
1. Call hotline
2. Wait 4 seconds
3. Press 8
4. Expect: Treated as menu input (invalid key)
5. Verify: Recording proceeds (consent window closed)
```

## Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Opt-out rate | <5% | (Opt-outs) / (Total calls) |
| Consent message completion | 100% | Message plays on every call |
| Recordings with consent | 100% | All `recording_url` entries have `recording_consent=true` |
| 90-day retention compliance | 100% | No recordings older than 90 days |

## Next Steps (H5)
Define rate-limiting thresholds to prevent abuse of hotline endpoints.
