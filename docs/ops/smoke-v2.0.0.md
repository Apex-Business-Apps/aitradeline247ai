# Operator Smoke Checklist — v2.0.0

## SMS Test

1. Send text message "hi" to your attached number
2. **Expected**: Row appears in `sms_reply_logs` within 10 seconds
3. **Expected**: Delivered status appears within 30 seconds
4. **Verify**: Check `/ops/twilio-evidence` for green SMS tiles

## Voice Test

1. Call your attached number from any phone
2. **Expected**: `/functions/v1/voice-answer` receives the call
3. **Expected**: `/functions/v1/voice-status` callback row appears in logs
4. **Verify**: Check `/ops/twilio-evidence` for green voice tiles

## Evidence Dashboard

1. Navigate to `/ops/twilio-evidence`
2. **Expected**: 3 green tiles for last 15 minutes:
   - SMS inbound received
   - SMS delivered status
   - Voice answer hit
   - Voice status callback OK

## Rollback Procedure

If tests fail:

1. **Option A**: Re-attach via `/onboarding/number` form
2. **Option B**: Clear all four Twilio webhooks for the Phone Number SID in Twilio Console
3. **Verify**: Stop receiving test traffic on affected endpoints

## Success Criteria

✅ All 3 tiles green  
✅ SMS round-trip < 30s  
✅ Voice connects and status callbacks fire  
✅ No 4xx/5xx errors in edge function logs
