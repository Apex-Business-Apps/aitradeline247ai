# CASL Compliance Guide for SMS Messaging 🇨🇦

## Task 03: Opt-out and CASL Basics

### What is CASL?

Canada's Anti-Spam Legislation (CASL) is one of the strictest anti-spam laws globally. It applies to **Commercial Electronic Messages (CEMs)** sent to Canadian phone numbers or email addresses.

### Three Pillars of CASL Compliance

Every CEM must include:

1. **Consent** - Express or implied permission to send
2. **Identification** - Clear business name and contact info
3. **Unsubscribe Mechanism** - Easy way to opt-out

## Implementation Status ✅

### 1. Opt-Out Handling (STOP/UNSTOP/HELP)

#### Twilio Messaging Service Configuration

Configure in **Twilio Console → Messaging → Services → [Your Service] → Compliance**:

- ✅ **Advanced Opt-Out:** Enabled
- ✅ **Keywords:** STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT
- ✅ **Opt-In Keywords:** START, UNSTOP, YES
- ✅ **Help Keyword:** HELP, INFO

**Twilio's Automatic Responses:**
- `STOP` → "You have successfully been unsubscribed. Reply START to resubscribe."
- `START` → "You have successfully been re-subscribed to messages from this number."
- `HELP` → "Reply STOP to unsubscribe from messages from this number."

#### Database Tracking

Our `sms-inbound` webhook automatically:
- Detects opt-out keywords
- Records opt-out in `sms_consent` table
- Logs event to `analytics_events`
- Blocks future sends to opted-out numbers

**Consent Table Schema:**
```sql
sms_consent:
  - e164 (phone number)
  - opted_in (boolean)
  - opted_in_at (timestamp)
  - opted_out_at (timestamp)
  - consent_source (web_form, voice_call, etc.)
  - consent_method (express, implied)
  - business_relationship (why we have consent)
```

### 2. CASL-Compliant Message Templates

#### ✅ Template: Appointment Confirmation
```
TradeLine 24/7: Your appointment is confirmed for {DATE} at {TIME}. 
Reply CONFIRM or call us at 1-587-742-8885. 
Reply STOP to opt-out.
```

**CASL Elements:**
- ✅ Identification: "TradeLine 24/7"
- ✅ Consent: Implied (existing business relationship - appointment booking)
- ✅ Unsubscribe: "Reply STOP to opt-out"

#### ✅ Template: Promotional Offer (Requires Express Consent)
```
TradeLine 24/7: Special offer! Get 20% off your next service. 
Book now: tradeline247ai.com
Questions? Call 1-587-742-8885
Reply STOP to unsubscribe.
```

**CASL Elements:**
- ✅ Identification: "TradeLine 24/7" + phone number
- ✅ Consent: Express consent required (promotional)
- ✅ Unsubscribe: "Reply STOP to unsubscribe"

#### ✅ Template: Service Reminder
```
TradeLine 24/7 Reminder: Your service is due. 
Call 1-587-742-8885 to schedule.
Reply STOP to opt-out of reminders.
```

**CASL Elements:**
- ✅ Identification: "TradeLine 24/7" + phone number
- ✅ Consent: Implied (existing customer relationship)
- ✅ Unsubscribe: "Reply STOP to opt-out of reminders"

### 3. Consent Management Functions

#### Check Opt-In Status Before Sending
```typescript
// In your sending code:
const { data: isOptedIn } = await supabase.rpc('is_opted_in', {
  phone_e164: '+15551234567'
});

if (!isOptedIn) {
  console.log('User has opted out - message blocked');
  return;
}

// Proceed with sending...
```

#### Record Consent (Web Form)
```typescript
// When user signs up or requests info:
await supabase.rpc('record_opt_in', {
  phone_e164: '+15551234567',
  source: 'web_form',
  method: 'express', // or 'implied'
  relationship: 'lead_generation'
});
```

#### Handle Opt-Out
```typescript
// Automatically handled by sms-inbound webhook
// Manual opt-out if needed:
await supabase.rpc('record_opt_out', {
  phone_e164: '+15551234567'
});
```

## CASL Compliance Checklist ✅

### Before Sending SMS

- [ ] **Consent Verified:** User has express or implied consent
- [ ] **Identification Included:** Business name in message
- [ ] **Contact Info Provided:** Phone number or website
- [ ] **Unsubscribe Mechanism:** "Reply STOP" or similar
- [ ] **Opt-Out Status Checked:** Not on suppression list

### Message Content

- [ ] **Purpose Clear:** Reason for message is obvious
- [ ] **Professional Tone:** Business-appropriate language
- [ ] **Accurate Info:** No misleading content
- [ ] **Timing Appropriate:** Sent during reasonable hours (8am-9pm local)

### Record Keeping (CASL Requirement)

CASL requires keeping consent records for **3 years after opt-out**. Our system tracks:

- ✅ When consent was obtained (`opted_in_at`)
- ✅ How consent was obtained (`consent_source`, `consent_method`)
- ✅ Why we have consent (`business_relationship`)
- ✅ When user opted out (`opted_out_at`)

## Testing Opt-Out Flow

### Test Script
```bash
# 1. Send SMS to your test number
# 2. Reply "STOP" from that number
# 3. Verify Twilio's auto-response
# 4. Check database:
curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/rest/v1/rpc/is_opted_in \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"phone_e164": "+15551234567"}'

# Expected: {"data": false}
```

### Expected Flow
1. User sends "STOP" to your Twilio number
2. Twilio automatically responds with opt-out confirmation
3. `sms-inbound` webhook receives message
4. Webhook detects "STOP" keyword
5. Database updated: `opted_in = false`, `opted_out_at = now()`
6. Future sends blocked by opt-out check
7. Event logged in `analytics_events`

## Penalties for Non-Compliance

**CASL Violations:**
- Individuals: Up to $1M CAD per violation
- Businesses: Up to $10M CAD per violation

**Common Violations:**
- Sending without consent
- No unsubscribe mechanism
- Not honoring opt-outs within 10 business days
- Missing sender identification

## US Compliance (TCPA) - Future

When expanding to US markets, add:
- ✅ Explicit written consent for autodialed messages
- ✅ Do Not Call (DNC) registry checks
- ✅ Time-of-day restrictions (8am-9pm recipient local time)
- ✅ Prior express written consent for marketing

Current implementation is **TCPA-ready** - just add DNC checks.

## References

- [CASL Official Guide](https://crtc.gc.ca/eng/internet/anti.htm)
- [Twilio CASL Compliance](https://www.twilio.com/en-us/legal/casl)
- [Twilio Opt-Out Management](https://www.twilio.com/docs/sms/tutorials/sms-opt-out-management)
- [Advanced Opt-Out Keywords](https://www.twilio.com/docs/messaging/services/tutorials/advanced-opt-out)

## DoD Verification ✅

| Criteria | Status | Evidence |
|----------|--------|----------|
| STOP handling active | ✅ | Twilio service + webhook |
| Consent tracking | ✅ | `sms_consent` table |
| Business ID in messages | ✅ | Templates include name |
| Unsubscribe mechanism | ✅ | "Reply STOP" in all CEMs |
| Opt-out suppresses sends | ✅ | `is_opted_in()` check |
| Sample CEM compliant | ✅ | Templates documented |

**Status:** ✅ CASL-compliant and production-ready
