# Release Evidence Request

## v2.0.0

### Required Screenshots

#### 1. Onboarding Success Card
- **Location**: `/onboarding/number` after successful attach
- **Must show**:
  - Phone number in E.164 format
  - Twilio Phone Number SID (PN...)
  - "Webhooks updated" confirmation message

#### 2. Twilio Number Configuration
- **Location**: Twilio Console → Phone Numbers → Active Number
- **Must show**: All four production webhook URLs configured:
  - Voice URL: `/functions/v1/voice-answer`
  - Voice Status: `/functions/v1/voice-status`
  - SMS URL: `/functions/v1/webcomms-sms-reply`
  - SMS Status: `/functions/v1/webcomms-sms-status`

#### 3. SMS Logs
- **Location**: Database query or Supabase dashboard
- **Must show**:
  - Latest inbound SMS (MessageSid starting with SM...)
  - Final delivered status row for the same message

#### 4. Edge Function Logs
- **Location**: Supabase Edge Function logs
- **Function**: `ops-twilio-attach-number`
- **Must show**: Complete flow:
  - Number search in Twilio
  - Webhook update operation
  - Success response with Phone Number SID

### Evidence Dashboard Screenshot

#### 5. TwilioEvidence Page
- **Location**: `/ops/twilio-evidence`
- **Must show**: All tiles green for last 15 minutes

## Capture Instructions

- Use full-screen captures (crop PII as needed)
- Timestamp visible in screenshots
- Store in `release/evidence-v2.0.0/` directory
- Name files descriptively: `01-onboarding-success.png`, `02-twilio-webhooks.png`, etc.
