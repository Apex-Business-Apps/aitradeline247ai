# Twilio Voice Integration - Production Standard

This document outlines the Twilio Voice telephony system implementation for TradeLine 24/7.

## Environment Variables

The following secrets are configured in Supabase Edge Functions:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Additional constants in the code:
```
PUBLIC_DID_E164=+15877428885    # Your Twilio phone number
FORWARD_TARGET_E164=+14319900222  # Destination number for forwarding
BASE_URL=https://jbcxceojrztklnvwgyrq.supabase.co/functions/v1
```

## Webhook Endpoints

### POST /voice-answer
- **Purpose**: Handles incoming calls with consent banner and call forwarding
- **Security**: Validates X-Twilio-Signature header
- **Response**: Returns TwiML with consent message and dial instruction
- **Logging**: Records call initiation in analytics_events table

### POST /voice-status  
- **Purpose**: Handles call status updates (initiated, ringing, answered, completed)
- **Security**: Validates X-Twilio-Signature header
- **Response**: Always returns 200 OK to prevent Twilio retries
- **Logging**: Records call lifecycle events with idempotency by CallSid

## Twilio Number Configuration

For your Twilio DID **+1-587-742-8885**, configure:

1. **Voice webhook**: `POST https://jbcxceojrztklnvwgyrq.supabase.co/functions/v1/voice-answer`
2. **Status callback**: `POST https://jbcxceojrztklnvwgyrq.supabase.co/functions/v1/voice-status`
   - Events: initiated, ringing, answered, completed
3. **Failover**: TwiML Bin "ring group b" (see below)

## TwiML Bin Fallback (Carrier-Grade Resilience)

Create a TwiML Bin named **"ring group b"** with this content:

```xml
<Response>
  <Say>Please hold…</Say>
  <Pause length="1"/>
  <Dial timeout="25" answerOnBridge="true">
    <Number>+14319900222</Number>
  </Dial>
</Response>
```

This ensures calls are still connected even if the main application is down.

## Compliance Features

### PIPEDA Compliance
- **Consent Banner**: Every call starts with "This call may be recorded to deliver your message and improve service. To continue, please stay on the line."
- **Recording**: No automatic recording - consent required before starting
- **PII Minimization**: Only essential call data is logged (CallSid, numbers, timestamps, status)

### CRTC Compliance
- Ready for telemarketing rules if outbound calling is added
- Supports Do-Not-Call list integration
- Maintains proper call records

### STIR/SHAKEN
- Uses verified Caller ID (+1-587-742-8885)
- Relies on carrier-level attestation for spam protection

## Security Features

- **Webhook Validation**: All endpoints validate Twilio signatures
- **HTTPS Only**: All communications over encrypted channels
- **No Raw SQL**: Uses Supabase client methods only
- **Background Logging**: Non-blocking call logging
- **Error Handling**: Graceful fallback responses

## Operational Features

- **Idempotency**: Call logging uses upserts by CallSid to prevent duplicates
- **Alerting**: Automatic warnings for failed calls (busy, no-answer, failed)
- **Timeout Protection**: 25-second dial timeout with answerOnBridge
- **Backoff**: Background tasks handle upstream errors gracefully

## Testing Checklist

### Happy Path Test
1. Call **+1-587-742-8885**
2. Should hear: "Hello. This call may be recorded..."
3. Should ring and connect to **+1-431-990-0222**
4. Check logs for call lifecycle

### Failover Test
1. Stop the Supabase Edge Functions (simulate downtime)
2. Call **+1-587-742-8885**
3. Should still connect via TwiML Bin fallback
4. Connection should complete within 25 seconds

### Security Test
1. Send request with invalid/missing X-Twilio-Signature
2. Should receive 403 Forbidden response
3. Valid requests should process normally

## Monitoring & Alerts

Watch for these log patterns:

- **ERROR**: "Invalid Twilio signature" → Security issue
- **WARN**: "Call ended with status: busy/no-answer/failed" → Service quality
- **INFO**: "Call logged successfully" → Normal operation

## Maintenance

### Rotating Secrets
1. Generate new Auth Token in Twilio Console
2. Update `TWILIO_AUTH_TOKEN` secret in Supabase
3. No application restart required

### Disabling Recording
Recording is disabled by default. To enable:
1. Modify TwiML to add `<Record>` instruction
2. Ensure consent flow is updated
3. Handle RecordingUrl in status callback

### DNCL Integration
- Implement Do-Not-Call list checking in voice-answer function
- Query internal DNC database before processing calls
- Reject calls based on caller number

## Support Links

- [Twilio Console](https://console.twilio.com)
- [CRTC Unsolicited Telecommunications Rules](https://crtc.gc.ca/eng/phone/telemarketing/unreq.htm)
- [Privacy Commissioner of Canada](https://www.priv.gc.ca)
- [Supabase Edge Functions Logs](https://supabase.com/dashboard/project/jbcxceojrztklnvwgyrq/functions/voice-answer/logs)