# PRODUCTION SNAPSHOT - TradeLine 24/7
**Date:** October 8, 2025  
**System:** AI Receptionist Platform  
**Status:** PRODUCTION READY  

---

## SYSTEM OVERVIEW

**TradeLine 24/7** is an enterprise-grade AI receptionist platform handling voice calls, SMS, and real-time WebSocket streams for Canadian and US clients.

**Stack:**
- Frontend: React + Vite + Tailwind CSS + TypeScript
- Backend: Supabase (PostgreSQL + Edge Functions)
- Voice/SMS: Twilio
- AI: OpenAI (voice + embeddings)
- Email: Resend

---

## CANONICAL ENDPOINTS

### Voice (Inbound Calls)
```
Primary:   https://api.tradeline247ai.com/functions/v1/voice-answer
Status:    https://api.tradeline247ai.com/functions/v1/voice-status
Stream:    wss://api.tradeline247ai.com/functions/v1/voice-stream
Fallback:  TwiML Bin → +1 431-990-0222
```

### SMS (Messaging)
```
Inbound:   https://api.tradeline247ai.com/functions/v1/webcomms-sms-reply
Status:    https://api.tradeline247ai.com/functions/v1/webcomms-sms-status
Legacy:    /twilio/sms → webcomms-sms-reply (alias)
           /twilio/sms-status → webcomms-sms-status (alias)
```

### Admin Operations
```
Buy Number:        /functions/v1/ops-twilio-buy-number
Hosted SMS:        /functions/v1/ops-twilio-hosted-sms
Port Creation:     /functions/v1/ops-twilio-create-port
A2P Workflow:      /functions/v1/ops-twilio-a2p
Voice Config:      /functions/v1/ops-voice-config-update
Evidence:          /ops/twilio-evidence (UI)
Number Onboard:    /ops/numbers/onboard (UI)
```

---

## DATABASE SCHEMA (Key Tables)

### Voice & Calls
```sql
calls (call_sid UNIQUE, org_id, status, started_at, booked)
call_logs (id, call_sid, from_e164, to_e164, transcript, duration_sec)
call_lifecycle (call_sid UNIQUE, status, start_time, end_time, meta)
voice_stream_logs (call_sid UNIQUE, started_at, connected_at, elapsed_ms, fell_back)
```

### SMS & Messaging
```sql
sms_reply_logs (external_id UNIQUE, to_e164, from_e164, body, created_at)
sms_status_logs (external_id UNIQUE, status, error_code, updated_at)
messaging_compliance (org_id, us_enabled, brand_sid, campaign_sid)
```

### Client Management
```sql
twilio_endpoints (number_e164 UNIQUE, org_id, voice_url, sms_url, subaccount_sid)
contacts (id, org_id, e164, first_name, e164_encrypted, first_name_encrypted)
appointments (id, org_id, email, e164, start_at, status, pii_iv)
campaigns (id, org_id, name, subject, body_template, status)
campaign_members (id, campaign_id, lead_id, status, sent_at)
```

### Security & Audit
```sql
data_access_audit (user_id, accessed_table, accessed_record_id, access_type)
security_alerts (alert_type, user_id, severity, event_data, resolved)
analytics_events (event_type, user_id, ip_address, event_data, created_at)
encryption_errors (error_type, function_name, error_message, metadata)
```

### RAG Knowledge Base
```sql
rag_sources (id, source_type, external_id UNIQUE, title, uri)
rag_chunks (id, source_id, text, meta)
rag_embeddings (id, chunk_id, embedding vector(1536))
```

---

## ENVIRONMENT VARIABLES (Required)

### Twilio
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_API_KEY_SID=SK...
TWILIO_API_KEY_SECRET=...
TWILIO_PHONE_NUMBER=+15877428885
```

### OpenAI
```bash
OPENAI_API_KEY=sk-...
```

### Resend (Email)
```bash
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@tradeline247ai.com
NOTIFY_TO=admin@tradeline247ai.com
```

### Supabase (Auto-configured)
```bash
SUPABASE_URL=https://hysvqdwmhxnblxfqnszn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## CRITICAL WORKFLOWS

### 1. Voice Call Flow
```
1. Inbound call → /voice-answer
2. Consent TwiML → DTMF 1=yes
3. <Connect><Stream url="wss://.../voice-stream" />
4. Watchdog: If handshake > 3s → fallback to <Say><Dial>
5. Status updates → /voice-status
6. Record in call_logs + voice_stream_logs
```

### 2. SMS Flow
```
1. Inbound SMS → /webcomms-sms-reply
2. Verify Twilio signature
3. Upsert sms_reply_logs (external_id=MessageSid UNIQUE)
4. Template/queue response
5. Delivery updates → /webcomms-sms-status
6. Upsert sms_status_logs (external_id UNIQUE)
```

### 3. Client Onboarding (Quick-Start)
```
1. Admin → /ops/numbers/onboard
2. Select "Quick-Start" → Country=CA
3. Buy local number via /ops-twilio-buy-number
4. Auto-configure:
   - VoiceUrl: /voice-answer
   - SmsUrl: /webcomms-sms-reply
   - Call StatusCallback: /voice-status
   - SMS StatusCallback: /webcomms-sms-status
5. Insert twilio_endpoints record
6. Generate PDF "Forwarding Kit"
7. Evidence → /ops/twilio-evidence
```

### 4. US A2P Activation (Gated)
```
1. Admin toggles us_enabled=true
2. Create Brand → /ops-twilio-a2p (brand_sid)
3. Create Campaign → /ops-twilio-a2p (campaign_sid)
4. Attach number to Messaging Service
5. Store in messaging_compliance
6. Canada-only clients: skip entirely
```

### 5. Campaign Send (DRIFT)
```
1. Admin → /ops/campaigns
2. Import CSV → leads table
3. Create campaign → campaigns table
4. Send batch → campaign_members (status='pending')
5. Edge function processes queue
6. Resend API sends emails
7. Track unsubscribes → unsubscribes table
8. Follow-ups → campaign_followups (scheduled_at)
```

---

## SECURITY ARCHITECTURE

### Encryption (PII Fields)
```
- appointments: email_encrypted, e164_encrypted, first_name_encrypted
- contacts: e164_encrypted, first_name_encrypted
- Uses AES-256-CBC with per-record IV (pii_iv)
- Master key stored in app_config (service_role only)
- Function: encrypt_pii_field(plaintext, iv_seed)
```

### RLS Policies
```
- All tables: service_role has full access
- User tables: is_org_member(org_id) OR has_role('admin')
- PII tables: SELECT blocked (use secure functions)
- Audit tables: admins can SELECT, service_role can INSERT
```

### Audit Logging
```
- All PII access → data_access_audit
- Security events → security_alerts
- Analytics → analytics_events
- Failed auth → analytics_events (event_type='auth_failed')
```

### Rate Limiting
```
- Hotline: 5 calls/15min per ANI
- Contact form: 3 submissions/hour per IP
- RAG search: 60 req/min per user
- Edge functions: Circuit breaker on external APIs
```

---

## PERFORMANCE TARGETS

### Voice SLOs
```
✓ Handshake P95 < 1500ms (watchdog at 3000ms)
✓ Answer latency < 800ms
✓ Failover < 5% of calls
✓ Transcript delivery < 30s
```

### SMS SLOs
```
✓ Inbound processing < 200ms
✓ Delivery rate > 98%
✓ Status callback < 500ms
```

### Frontend SLOs
```
✓ LCP < 2500ms
✓ CLS < 0.1
✓ TTFB < 800ms
✓ Lighthouse Score > 90
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deploy
```bash
# 1. Run migrations
supabase db push

# 2. Verify secrets
supabase secrets list

# 3. Test edge functions locally
supabase functions serve voice-answer

# 4. Run smoke tests
npm run test:smoke
```

### Deploy
```bash
# 1. Deploy edge functions
supabase functions deploy

# 2. Deploy frontend
npm run build
# Upload dist/ to production CDN

# 3. Verify DNS
dig api.tradeline247ai.com
dig tradeline247ai.com
```

### Post-Deploy
```bash
# 1. Test voice webhook
curl -X POST https://api.tradeline247ai.com/functions/v1/voice-answer

# 2. Test SMS webhook
curl -X POST https://api.tradeline247ai.com/functions/v1/webcomms-sms-reply

# 3. Check evidence dashboard
open https://tradeline247ai.com/ops/twilio-evidence

# 4. Monitor logs (24h)
supabase functions logs voice-answer
supabase functions logs webcomms-sms-reply
```

---

## MONITORING & ALERTS

### Evidence Dashboard (/ops/twilio-evidence)
```
Tiles (24h rolling):
- Inbound Calls: answered / failed / stream-fallback
- Voice Stream: avg handshake ms, P95 < 1500ms
- SMS Activity: inbound count, delivery success rate
- New Numbers: purchased count, subaccount SIDs

Link-outs to Supabase:
- Voice Stream Logs (24h filter)
- SMS Reply Logs (24h filter)
- SMS Status Logs (24h filter)
- Twilio Buy Number Logs (24h filter)
```

### Critical Alerts
```
🚨 Voice handshake P95 > 2000ms → investigate stream latency
🚨 SMS delivery < 95% → check Twilio status
🚨 Failover rate > 10% → check voice-stream health
🚨 Security alert unresolved > 1h → escalate to admin
```

---

## OPERATOR SMOKE TEST

### Voice Test
```bash
# 1. Call +1 587-742-8885
# 2. Hear consent prompt (English/French)
# 3. Press 1 (consent)
# 4. AI should greet within 2s
# 5. Say "Book appointment" → should capture
# 6. Hang up

# Evidence:
SELECT * FROM calls WHERE call_sid = 'CA...' ORDER BY started_at DESC LIMIT 1;
SELECT * FROM voice_stream_logs WHERE call_sid = 'CA...';
# Expect: stream_fallback=false, elapsed_ms < 1500
```

### SMS Test
```bash
# 1. Text "Hello" to +1 587-883-9797
# 2. Receive auto-reply within 5s

# Evidence:
SELECT * FROM sms_reply_logs ORDER BY created_at DESC LIMIT 1;
SELECT * FROM sms_status_logs WHERE external_id = 'SM...';
# Expect: status='delivered'
```

### Number Provisioning Test
```bash
# 1. Login as admin → /ops/numbers/onboard
# 2. Select "Quick-Start" → CA → Area Code 587
# 3. Click "Purchase"
# 4. Wait for success message

# Evidence:
SELECT * FROM twilio_endpoints ORDER BY created_at DESC LIMIT 1;
SELECT * FROM twilio_buy_number_logs ORDER BY created_at DESC LIMIT 1;
# Expect: voice_url='/functions/v1/voice-answer', sms_url='/functions/v1/webcomms-sms-reply'
```

---

## ROLLBACK PROCEDURES

### Voice Stream Disable
```sql
-- Disable streaming for specific client
UPDATE twilio_endpoints 
SET meta = jsonb_set(meta, '{stream_enabled}', 'false'::jsonb)
WHERE org_id = '...';

-- Voice calls will fallback to Say → Dial (no stream)
```

### SMS Revert to Legacy
```sql
-- Point back to old alias (behavior identical)
UPDATE twilio_endpoints 
SET sms_url = '/functions/v1/twilio/sms'
WHERE number_e164 = '+15878839797';

-- Old alias redirects to /webcomms-sms-reply internally
```

### Database Restore (Emergency)
```bash
# Restore from point-in-time backup
supabase db restore --point-in-time "2025-10-08T12:00:00Z"

# Verify data integrity
SELECT COUNT(*) FROM calls WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## COMPLIANCE & DATA RETENTION

### CASL/TCPA Compliance
```
✓ Express consent required (voice DTMF, SMS opt-in)
✓ Unsubscribe honored within 10 days
✓ Consent logs retained 3 years
✓ US A2P: 10DLC registration required
✓ Canada: CASL-compliant templates
```

### Data Retention
```
- Raw webhook payloads: 30 days
- Call transcripts: 90 days (redacted after)
- PII audit logs: 3 years
- Analytics events: 90 days (anonymized after)
- Encryption key audit: forever
```

### PII Masking (Non-Admins)
```sql
-- Profiles: mask phone
SELECT mask_phone_number(phone_e164, auth.uid()) FROM profiles;
-- Returns: +1 587-***-8885

-- Appointments: use secure function
SELECT * FROM get_secure_appointment('appointment-uuid');
-- Returns: email_masked='j***@example.com'
```

---

## SUPPORT & ESCALATION

### Tier 1: Self-Service
```
- Evidence dashboard shows green → OK
- Evidence dashboard shows red → check logs
- Logs show 200 responses → webhooks healthy
- Logs show 500 errors → escalate to Tier 2
```

### Tier 2: Developer
```
- Check Supabase logs (24h)
- Check Twilio debugger
- Verify webhook signatures
- Test endpoints with cURL
- Review security_alerts table
```

### Tier 3: Infrastructure
```
- DNS propagation issues
- Certificate renewal failures
- Database connection pool exhaustion
- Twilio account limits
- OpenAI rate limits
```

### Emergency Contacts
```
Primary:   admin@tradeline247ai.com
Twilio:    support.twilio.com (P1 ticket)
Supabase:  support.supabase.com (Enterprise SLA)
OpenAI:    platform.openai.com/account/support
```

---

## KNOWN ISSUES & WORKAROUNDS

### Issue: Voice stream intermittent timeout
**Symptom:** Calls fallback to non-stream path  
**Workaround:** Watchdog handles gracefully, check network latency  
**Fix:** Increase buffer if P95 > 2000ms consistently  

### Issue: SMS status "undelivered" for landlines
**Symptom:** Delivery fails for non-mobile numbers  
**Expected:** SMS requires mobile number, filter at import  
**Fix:** Validate E.164 with Twilio Lookup API  

### Issue: Duplicate webhook POSTs
**Symptom:** Same MessageSid logged twice  
**Expected:** UNIQUE constraint prevents duplicates  
**Fix:** Verify upsert logic in webcomms-sms-reply  

---

## REFERENCES

### Twilio Docs
- Voice Webhooks: https://www.twilio.com/docs/voice/twiml
- Media Streams: https://www.twilio.com/docs/voice/media-streams
- Messaging Services: https://www.twilio.com/docs/messaging/services
- A2P 10DLC: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc

### Supabase Docs
- Edge Functions: https://supabase.com/docs/guides/functions
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- Realtime: https://supabase.com/docs/guides/realtime

### Internal Docs
- RAG_API_CONTRACT.md (RAG search/answer)
- DRIFT_COMPLETE_SUMMARY.md (Campaign workflow)
- TWILIO_VOICE_README.md (Voice flow)
- CASL_COMPLIANCE_GUIDE.md (Canadian compliance)

---

## VERSION HISTORY

**v2.0.0** (2025-10-08) - CURRENT
- Canonical endpoint alignment
- Voice stream watchdog (3s)
- SMS reply/status webhooks
- Number onboarding wizard
- Evidence dashboard
- A2P gating for US
- PII encryption (AES-256)

**v1.5.0** (2025-10-05)
- Security hardening
- RLS policy updates
- Audit logging
- Performance optimization

**v1.0.0** (2025-09-01)
- Initial production launch
- Basic voice/SMS
- Admin dashboard

---

## GO-LIVE DECLARATION

✅ **PRODUCTION READY** - October 8, 2025

**Criteria Met:**
- ✅ Zero-touch CA client provisioning
- ✅ Deterministic call/SMS routing by To
- ✅ Evidence tiles green (24h)
- ✅ Duplicate webhooks impossible (UNIQUE constraints)
- ✅ US texting gated (no A2P unless toggled)
- ✅ Rollback tested (no data loss)
- ✅ Smoke tests pass (voice + SMS + provisioning)

**Next Milestones:**
- Week 2: Full port workflow
- Week 3: Multi-language consent
- Week 4: WhatsApp integration

---

**END OF PRODUCTION SNAPSHOT**