# Twilio Webhooks Configuration Checklist

## Where to Configure

**Twilio Console** → **Phone Numbers** → **Active Numbers** → Select your number → **Configure**

## Required Webhooks (All POST)

### Voice Configuration

1. **Voice webhook**:
   - URL: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-answer`
   - Method: `POST`

2. **Voice status callback**:
   - URL: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-status`
   - Method: `POST`

### SMS Configuration

3. **SMS webhook**:
   - URL: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/webcomms-sms-reply`
   - Method: `POST`

4. **SMS status callback**:
   - URL: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/webcomms-sms-status`
   - Method: `POST`

## Security

- ✅ **Signature verification**: ON (enforced server-side)

## Verification Steps

1. **Place test call**: Dial your attached number
2. **Send test SMS**: Text "hi" to your attached number
3. **Check logs**: Verify entries in:
   - `call_logs` table
   - `sms_reply_logs` table
   - `voice_stream_logs` table
4. **Check evidence dashboard**: Navigate to `/ops/twilio-evidence` and confirm green tiles

## Troubleshooting

- **No logs appearing**: Verify webhook URLs are exactly as listed above
- **4xx errors**: Check signature verification is enabled
- **5xx errors**: Check edge function logs for detailed error messages
