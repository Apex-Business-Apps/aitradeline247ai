# Telephony Setup - TradeLine 24/7

## Overview
TradeLine 24/7 uses Twilio for voice calls with Canadian-compliant consent management and AI-first routing with human fallback.

## Voice Flow Architecture

```
Incoming Call
    ↓
[1] Front Door (/voice-frontdoor)
    - Canadian consent disclosure (en-CA)
    - Speech-based opt-out detection
    - "Say opt out to continue without recording"
    ↓
[2] Consent Handler (/voice-consent-speech)
    - Detects "opt out", "no recording", etc.
    - Sets recording preference
    ↓
[3] Route (/voice-route)
    - AI-first: Try AI receptionist (6s timeout)
    - Fallback: Human agent
    - Recording based on consent
    ↓
[4] Status Tracking (/voice-status)
    - Logs to call_logs and call_lifecycle
    - Tracks duration, recording URLs, etc.
```

## Environment Variables

Required for voice functions:

```bash
# Twilio Authentication
TWILIO_AUTH_TOKEN=your_auth_token_here

# Routing Configuration
OPS_NUMBER=+14319900222  # Human fallback number (E.164 format)
BUSINESS_TARGET_E164=+14319900222  # Alternative env var

# AI Configuration (optional - choose one)
ENV_AI_WEBHOOK=https://your-ai-service.com/webhook
ENV_TWILIO_STREAM_URL=wss://your-ai-service.com/stream

# Supabase (auto-configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Twilio Console Configuration

### Step 1: Configure Voice URL

1. Log into [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your TradeLine 24/7 number
4. Scroll to **Voice Configuration**
5. Set:
   - **A CALL COMES IN**: `Webhook`
   - **URL**: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-frontdoor`
   - **HTTP**: `POST`
6. Click **Save**

### Step 2: Configure Status Callback

1. In the same voice configuration section
2. Set **STATUS CALLBACK URL**:
   - **URL**: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-status`
   - **HTTP**: `POST`
   - **EVENTS**: Check all: `Initiated`, `Ringing`, `Answered`, `Completed`
3. Click **Save**

## Canadian Compliance (PIPEDA/PIPA)

### Consent Disclosure
The system provides clear notice before recording:
- Language: Canadian English (en-CA)
- Voice: Amazon Polly Joanna
- Message: "This call may be recorded to improve service quality. Say opt out to continue without recording."

### Opt-Out Mechanism
Callers can opt out by saying:
- "opt out"
- "no recording"
- "don't record"
- "no record"

### Recording Behavior
- **Consent given** (default): `record="record-from-answer-dual"` (both parties)
- **Opt-out**: `record="do-not-record"` (no recording)

## Security Features

### Request Validation
All Twilio webhooks validate `X-Twilio-Signature` using HMAC-SHA1:
- Enforced on all `/voice-*` endpoints
- Returns `403 Forbidden` on signature mismatch
- Uses `TWILIO_AUTH_TOKEN` for validation

### Rate Limiting
In-memory rate limiting (Edge-compatible):
- **Per caller number**: 10 requests/minute
- **Per IP address**: 10 requests/minute
- Response: `429 Too Many Requests` with friendly TwiML

### Input Sanitization
- Phone numbers: E.164 format validation
- CallSid: Alphanumeric validation
- Speech results: Length limits

## Database Tables

### call_logs
Primary call tracking table:
```sql
- call_sid: Twilio unique identifier
- from_e164: Caller number (E.164)
- to_e164: Destination number (E.164)
- mode: 'ai_first' | 'direct_dial'
- consent_given: boolean (recording consent)
- status: Call status
- started_at: Call start timestamp
- ended_at: Call end timestamp
- duration_sec: Call duration
- recording_url: Recording URL (if consent given)
- transcript: Call transcript (if available)
```

### call_lifecycle
Detailed call events:
```sql
- call_sid: References call
- status: Event status
- start_time: Event start
- end_time: Event end
- meta: JSONB event metadata
```

## AI-First Routing

### With Media Streams
```typescript
ENV_TWILIO_STREAM_URL=wss://your-ai.com/stream
```
- Real-time audio streaming to AI
- Bidirectional communication
- AI responds directly to caller

### With Webhook
```typescript
ENV_AI_WEBHOOK=https://your-ai.com/webhook
```
- TwiML forwarding to AI service
- 6-second timeout
- Fallback to human on timeout

### Direct Dial (No AI)
If neither env var is set:
- Direct dial to `OPS_NUMBER`
- 30-second ring timeout
- Friendly voicemail message

## Testing

### Manual Test Flow

1. **Call the number**: Dial your configured Twilio number
2. **Hear disclosure**: "This call may be recorded..."
3. **Test opt-out**: Say "opt out" clearly
4. **Verify routing**: Call should route to AI or human
5. **Check database**: Verify `call_logs` entry with correct consent flag

### Simulated Test (Local)

```bash
# Test signature validation
curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-frontdoor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "CallSid=CAtest&From=%2B15551234567&To=%2B14319900222"
# Expected: 403 (missing signature)

# Test with valid signature (requires Twilio auth token)
# Use Twilio's request validator tool or make a real call
```

### Consent Flow Test

```bash
# Test opt-out detection
curl -X POST "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-consent-speech" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: valid_signature_here" \
  --data "CallSid=CAtest&SpeechResult=opt%20out&Confidence=0.95"
# Expected: TwiML with record=false
```

## Monitoring

### Supabase Edge Function Logs

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn)
2. Go to **Edge Functions** → **Logs**
3. Filter by function: `voice-frontdoor`, `voice-consent-speech`, `voice-route`, `voice-status`
4. Look for:
   - Signature validation failures (403 responses)
   - Rate limit triggers (429 responses)
   - Consent decisions (opt-out detection)
   - Routing decisions (AI vs human)

### Database Queries

```sql
-- Recent calls with consent status
SELECT 
  call_sid, 
  from_e164, 
  consent_given, 
  mode, 
  status, 
  started_at 
FROM call_logs 
ORDER BY started_at DESC 
LIMIT 20;

-- Opt-out rate
SELECT 
  COUNT(*) FILTER (WHERE consent_given = false) as opt_outs,
  COUNT(*) as total_calls,
  ROUND(100.0 * COUNT(*) FILTER (WHERE consent_given = false) / COUNT(*), 2) as opt_out_rate
FROM call_logs
WHERE started_at > NOW() - INTERVAL '7 days';

-- AI vs Human routing
SELECT 
  mode, 
  COUNT(*) as count 
FROM call_logs 
GROUP BY mode;
```

## Troubleshooting

### Issue: Calls not routing to front door
- **Check**: Twilio console voice URL is set correctly
- **Check**: Function is deployed (Supabase Edge Functions dashboard)
- **Check**: No recent function errors in logs

### Issue: Signature validation failures
- **Check**: `TWILIO_AUTH_TOKEN` is set correctly in Supabase secrets
- **Check**: Webhook URL matches exactly (no trailing slashes)
- **Check**: Using POST method in Twilio console

### Issue: Opt-out not working
- **Check**: Speech recognition confidence (should be > 0.5)
- **Check**: Caller is speaking clearly
- **Check**: Language is set to `en-CA` in Gather verb
- **Check**: Function logs show `SpeechResult` parameter

### Issue: Recording when shouldn't be
- **Check**: `consent_given` field in `call_logs` table
- **Check**: `record` parameter in TwiML Dial verb
- **Check**: Recording URLs should be null for opted-out calls

## Support

For issues or questions:
1. Check function logs in Supabase dashboard
2. Review call logs in database
3. Verify Twilio console configuration
4. Contact DevOps team

## References

- [Twilio Voice TwiML](https://www.twilio.com/docs/voice/twiml)
- [Twilio Media Streams](https://www.twilio.com/docs/voice/media-streams)
- [PIPEDA Compliance](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
