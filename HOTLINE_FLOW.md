# Phase H1 — Hotline Call Flow Definition

## Overview
Support hotline using existing Twilio number: **+1-587-742-8885**

## Call Flow Architecture

```
Incoming Call
    ↓
[1] Greeting & Consent
    ↓
[2] Main Menu (DTMF)
    ├─ Press 1: Sales
    ├─ Press 2: Support
    ├─ Press 9: Voicemail
    └─ Timeout/Invalid: Retry → Voicemail
    ↓
[3] Route to Handler
    ├─ Sales → Forward to +1-431-990-0222
    ├─ Support → Forward to support queue
    └─ Voicemail → Record message
    ↓
[4] Call Complete / Voicemail Saved
```

## Phase 1: Greeting & Consent (10 seconds)
```xml
<Say voice="Polly.Joanna">
  Thank you for calling TradeLine 24/7. 
  This call may be recorded for quality and training purposes. 
  By staying on the line, you consent to being recorded.
</Say>
```

**Timeout:** None (auto-proceed)

## Phase 2: Main Menu (30 seconds)
```xml
<Gather action="/voice/menu-handler" method="POST" 
        numDigits="1" timeout="5" finishOnKey="#">
  <Say voice="Polly.Joanna">
    Press 1 for Sales.
    Press 2 for Support.
    Press 9 to leave a voicemail.
  </Say>
</Gather>
```

**DTMF Inputs:**
- `1` → Sales queue
- `2` → Support queue  
- `9` → Voicemail
- `*` → Repeat menu
- **Timeout (5s):** Retry once, then voicemail
- **Invalid key:** Retry once, then voicemail

**Retry Logic:**
- First timeout/invalid: Repeat menu once
- Second timeout/invalid: "We didn't receive your selection. Transferring you to voicemail."

## Phase 3: Route to Handler

### Sales (Key: 1)
```xml
<Say>Connecting you to our sales team.</Say>
<Dial timeout="20" action="/voice/status">
  <Number>+14319900222</Number>
</Dial>
```
**Timeout:** 20 seconds → Voicemail if unanswered

### Support (Key: 2)
```xml
<Say>Connecting you to technical support.</Say>
<Dial timeout="20" action="/voice/status">
  <Queue>support-queue</Queue>
</Dial>
```
**Timeout:** 20 seconds → Voicemail if unanswered

### Voicemail (Key: 9 or Fallback)
```xml
<Say>Please leave a message after the tone. Press pound when finished.</Say>
<Record action="/voice/voicemail-handler" 
        maxLength="180" 
        finishOnKey="#"
        transcribe="true"
        transcribeCallback="/voice/transcription"/>
<Say>Thank you. Your message has been recorded. Goodbye.</Say>
<Hangup/>
```

## Phase 4: Voicemail Fallback
**Triggers:**
- Menu timeout (2x)
- Invalid input (2x)
- Handler timeout (unanswered after 20s)
- No agents available

**Storage:**
- Recording URL saved to `call_lifecycle` table
- Transcription saved when available
- Alert sent to admin via email

## Timeouts Summary
| Phase | Timeout | Retry | Fallback |
|-------|---------|-------|----------|
| Greeting | N/A | N/A | Auto-proceed |
| Menu Input | 5s | 1x | Voicemail |
| Sales Dial | 20s | 0 | Voicemail |
| Support Dial | 20s | 0 | Voicemail |
| Voicemail Record | 180s | 0 | Auto-save |

## Webhook Endpoints Required
1. **POST /voice/answer** - Initial call handler (existing)
2. **POST /voice/menu-handler** - DTMF menu processor (new)
3. **POST /voice/voicemail-handler** - Recording processor (new)
4. **POST /voice/transcription** - Transcription callback (new)
5. **POST /voice/status** - Call status updates (existing)

## Success Criteria
- ✅ Call answered within 3 rings
- ✅ Consent message plays before recording starts
- ✅ Menu navigable via DTMF
- ✅ Voicemail always available as fallback
- ✅ No infinite loops or dead ends
- ✅ Call duration tracked end-to-end

## Next Steps (H2)
Define security validation for all webhook endpoints.

