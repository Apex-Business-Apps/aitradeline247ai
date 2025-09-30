# Phase H3 — Hotline DTMF Input Collection

## Overview
Interactive Voice Response (IVR) menu using DTMF (Dual-Tone Multi-Frequency) keypad input.

**Technology:** DTMF only (no speech recognition for maximum reliability)

## TwiML Gather Configuration

### Main Menu Gather
```xml
<Gather 
  action="https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-menu-handler"
  method="POST"
  input="dtmf"
  numDigits="1"
  timeout="5"
  finishOnKey="#"
>
  <Say voice="Polly.Joanna">
    Press 1 for Sales.
    Press 2 for Support.
    Press 9 to leave a voicemail.
    Press star to repeat this menu.
  </Say>
</Gather>
```

### Gather Parameters Explained
| Parameter | Value | Purpose |
|-----------|-------|---------|
| `action` | `/voice-menu-handler` | Webhook to process DTMF input |
| `method` | `POST` | HTTP method for webhook |
| `input` | `dtmf` | Accept only keypad input (no speech) |
| `numDigits` | `1` | Wait for exactly 1 digit |
| `timeout` | `5` | Wait 5 seconds for input before timeout |
| `finishOnKey` | `#` | Pound key submits early (optional for 1-digit) |

## Valid DTMF Keys

### Menu Keys
| Key | Action | Description |
|-----|--------|-------------|
| `1` | Sales | Route to sales team (+1-431-990-0222) |
| `2` | Support | Route to support queue |
| `9` | Voicemail | Skip to voicemail |
| `*` | Repeat | Replay menu (no action callback) |

### Reserved Keys (Future)
| Key | Reserved For | Status |
|-----|--------------|--------|
| `0` | Operator | Future |
| `3-8` | Additional queues | Future |
| `#` | Submit/Confirm | Future (multi-digit) |

## Input Handling Logic

### Success Path (Valid Input)
```
User presses 1 → POST /voice-menu-handler with Digits=1
                 ↓
              Parse & Validate
                 ↓
            Generate TwiML response
                 ↓
            Connect to Sales
```

**Webhook Payload (Twilio → Edge Function):**
```http
POST /functions/v1/voice-menu-handler
Content-Type: application/x-www-form-urlencoded

CallSid=CA1234&From=%2B15551234567&Digits=1
```

**TwiML Response (Edge Function → Twilio):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you to our sales team.</Say>
  <Dial timeout="20" action="/voice-status">
    <Number>+14319900222</Number>
  </Dial>
</Response>
```

### Timeout Path (No Input)
```
5 seconds elapse with no input
    ↓
Gather timeout → POST /voice-menu-handler with NO Digits parameter
    ↓
Check retry count (stored in session)
    ↓
If retry_count < 1: Replay menu
If retry_count ≥ 1: Transfer to voicemail
```

**TwiML Response (First Timeout):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We didn't receive your selection. Let's try again.</Say>
  <Gather action="/voice-menu-handler?retry=1" 
          method="POST" 
          numDigits="1" 
          timeout="5">
    <Say voice="Polly.Joanna">
      Press 1 for Sales. Press 2 for Support. Press 9 for Voicemail.
    </Say>
  </Gather>
</Response>
```

**TwiML Response (Second Timeout):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Transferring you to voicemail.</Say>
  <Redirect>/voice-voicemail</Redirect>
</Response>
```

### Invalid Input Path (Wrong Key)
```
User presses 5 (not in menu)
    ↓
POST /voice-menu-handler with Digits=5
    ↓
Validate input → FAIL
    ↓
Check retry count
    ↓
If retry_count < 1: "Invalid selection, please try again" → Replay menu
If retry_count ≥ 1: Transfer to voicemail
```

**TwiML Response (Invalid Input):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid selection.</Say>
  <Redirect>/voice-answer?retry=1</Redirect>
</Response>
```

## Retry Logic State Machine

```
[FRESH CALL] (retry=0)
    ↓
  Play Menu
    ↓
┌──────────┬──────────┬──────────┐
│  Valid   │ Timeout  │ Invalid  │
│  Input   │          │  Input   │
└────┬─────┴────┬─────┴────┬─────┘
     │          │          │
     │          │          │
  Route     [RETRY 1]   [RETRY 1]
  to Dest    (retry=1)  (retry=1)
     │          │          │
     │      Play Menu  Play Menu
     │          │          │
     │    ┌─────┴─────┬─────┴─────┐
     │    │  Valid    │ Timeout/  │
     │    │  Input    │ Invalid   │
     │    └─────┬─────┴─────┬─────┘
     │          │            │
     │       Route      [VOICEMAIL]
     │       to Dest     (retry≥1)
     │          │            │
     └──────────┴────────────┘
                │
          Call Complete
```

## Implementation (Edge Function)

### Input Validation
```typescript
const validKeys = ['1', '2', '9', '*'];
const Digits = formData.get('Digits') as string | null;
const retryCount = parseInt(new URL(req.url).searchParams.get('retry') || '0');

if (!Digits) {
  // Timeout scenario
  if (retryCount >= 1) {
    return voicemailResponse();
  } else {
    return retryMenuResponse(retryCount + 1);
  }
}

if (!validKeys.includes(Digits)) {
  // Invalid key pressed
  if (retryCount >= 1) {
    return voicemailResponse();
  } else {
    return invalidInputResponse(retryCount + 1);
  }
}

// Valid input - route accordingly
switch (Digits) {
  case '1': return salesResponse();
  case '2': return supportResponse();
  case '9': return voicemailResponse();
  case '*': return repeatMenuResponse();
}
```

## Accessibility Considerations

### Slow Keypad Entry
- **Timeout: 5 seconds** allows for slow but deliberate input
- **Single digit** minimizes cognitive load
- **Retry allowed** for users who miss timing

### Hearing Impaired (TTY/TDD)
- DTMF works with TTY devices
- Text relay services compatible
- Future: Consider SMS fallback option

### Cognitive Accessibility
- **Simple menu structure** (3 options + repeat)
- **Clear instructions** ("Press 1 for Sales")
- **Confirmation messages** ("Connecting you to sales")
- **No nested menus** (single-level IVR)

## Testing Scenarios

### Test 1: Happy Path (Valid Input)
```
1. Call +1-587-742-8885
2. Listen to greeting + menu
3. Press 1 (within 5 seconds)
4. Expect: "Connecting you to our sales team"
5. Verify: Call connects to +1-431-990-0222
```

### Test 2: Timeout Retry
```
1. Call hotline
2. Listen to menu
3. Wait 5+ seconds (no input)
4. Expect: "We didn't receive your selection. Let's try again."
5. Press 2 (within 5 seconds)
6. Verify: Routes to support queue
```

### Test 3: Invalid Input Retry
```
1. Call hotline
2. Press 5 (invalid key)
3. Expect: "Invalid selection"
4. Menu replays
5. Press 9
6. Verify: Routes to voicemail
```

### Test 4: Double Timeout → Voicemail
```
1. Call hotline
2. Wait 5+ seconds (no input)
3. Menu replays
4. Wait 5+ seconds again (no input)
5. Expect: "Transferring you to voicemail"
6. Verify: Voicemail recording starts
```

### Test 5: Repeat Menu (Star Key)
```
1. Call hotline
2. Press * during menu
3. Expect: Menu replays immediately
4. Press 1
5. Verify: Routes to sales
```

## Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Menu completion rate | >95% | (Valid inputs) / (Total calls) |
| Timeout rate | <10% | (Timeouts) / (Total calls) |
| Invalid input rate | <5% | (Invalid keys) / (Total calls) |
| Repeat menu usage | <15% | (Star presses) / (Total calls) |
| First-attempt success | >85% | Valid input on first try |

## Next Steps (H4)
Define call recording consent language and opt-out mechanism.
