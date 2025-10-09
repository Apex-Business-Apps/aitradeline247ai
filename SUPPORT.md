# Support

## User Support

### Contact Methods

- **Email:** info@tradeline247ai.com
- **Phone:** +1-587-742-8885
- **Chat:** Available in-app (bottom right corner)

### Response Times

- **Critical (service down):** 2 hours
- **High (major feature broken):** 8 hours
- **Normal (questions, minor issues):** 24 hours
- **Low (feature requests, enhancements):** 48 hours

## Operator Support (Internal)

### Diagnostic Steps

1. **Start with evidence dashboard:** `/ops/twilio-evidence`
   - Check P95 handshake latency
   - Check fallback rate
   - Review recent call/message status

2. **Check Twilio Console:** [Debugger](https://console.twilio.com/us1/monitor/debugger)
   - Search by CallSid or MessageSid
   - Review webhook delivery status
   - Check error codes

3. **Check Database:**
   ```sql
   -- Recent calls
   SELECT * FROM calls ORDER BY created_at DESC LIMIT 10;
   
   -- Recent SMS
   SELECT * FROM sms_reply_logs ORDER BY created_at DESC LIMIT 10;
   
   -- Stream fallbacks
   SELECT * FROM voice_stream_logs WHERE fell_back = true ORDER BY created_at DESC LIMIT 10;
   ```

### Escalation Ladder

**Tier 1 (First Responder)**
- Verify incident via `/ops/twilio-evidence`
- Check Twilio Debugger for webhook errors
- Document CallSid/MessageSid, timestamp, endpoint

**Tier 2 (Development)**
- Review edge function logs in Supabase
- Check for signature verification failures
- Review database constraints and RLS policies

**Tier 3 (Infrastructure)**
- Review Supabase service health
- Check Twilio account status
- Investigate DNS/network issues

### Known Issues

See [GitHub Issues](https://github.com/apex-business-systems/tradeline247/issues) for tracked bugs and feature requests.

### Documentation

- [Voice Implementation](./REALTIME_VOICE_IMPLEMENTATION.md)
- [Delta Fix Verification](./DELTA_FIX_VERIFICATION.md)
- [Security Architecture](./SECURITY_ARCHITECTURE.md)

## Community

Join [GitHub Discussions](https://github.com/apex-business-systems/tradeline247/discussions) for:
- Feature requests
- General questions
- Best practices
- Integrations

---

**Apex Business Systems**  
Edmonton, AB, Canada  
info@tradeline247ai.com
