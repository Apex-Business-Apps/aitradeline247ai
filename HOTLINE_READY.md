# Phase HS4 — Hotline Readiness Checklist

## Objective
Confirm all design documentation for hotline IVR system is complete and approved before implementation.

## Status Overview

| Phase | Component | Status | Document | Approval |
|-------|-----------|--------|----------|----------|
| HS1 | Dry-Run Simulation | ✅ Complete | [HOTLINE_DRYRUN.md](./HOTLINE_DRYRUN.md) | N/A (design only) |
| HS2 | Consent Copy | ✅ Complete | [HOTLINE_CONSENT_DRAFT.md](./HOTLINE_CONSENT_DRAFT.md) | ⏳ Pending |
| HS3 | Abuse Guard | ✅ Complete | [HOTLINE_ABUSE_PLAN.md](./HOTLINE_ABUSE_PLAN.md) | N/A (design only) |
| HS4 | Readiness Checklist | ✅ Complete | **This document** | N/A |

## Phase HS1: Dry-Run Paths ✅

### Documented Paths
Three call flows have been simulated with mocked requests:

1. **Support Path (DTMF 1)**
   - User presses 1 at IVR menu
   - System generates TwiML redirect to human agent queue
   - Expected outcome: Call routed to support team
   - Dry-run status: ✅ Sequence documented, TwiML mocked

2. **Sales Path (DTMF 2)**
   - User presses 2 at IVR menu
   - System generates TwiML redirect to sales team queue
   - Expected outcome: Call routed to sales
   - Dry-run status: ✅ Sequence documented, TwiML mocked

3. **Timeout → AI Voicemail**
   - No DTMF input within 10 seconds
   - System transitions to AI voicemail prompt
   - Expected outcome: Caller leaves message, AI transcribes
   - Dry-run status: ✅ Sequence documented, TwiML mocked

### Verification Points
- [x] Sequence diagrams created for all paths
- [x] Expected TwiML responses documented
- [x] Analytics logging points identified
- [x] No actual network calls made (mocked only)
- [x] Timing estimates provided (3-8 seconds per interaction)

### Document Reference
**Location:** `HOTLINE_DRYRUN.md`  
**Created:** 2025-01-31  
**Reviewed by:** [Pending implementation team review]

## Phase HS2: Consent Copy (EN/FR-CA) ✅

### Consent Scripts Prepared

#### Live Call Consent
- **English version:** ✅ Drafted
- **French Canadian version:** ✅ Drafted
- **DTMF options:** 1 = Consent, 9 = Opt-out
- **Default behavior:** No recording if no input
- **Timing:** 10-second response window

#### Voicemail Consent
- **English version:** ✅ Drafted
- **French Canadian version:** ✅ Drafted
- **Disclosure:** Clear statement that message will be recorded
- **Opt-out:** Caller advised to hang up if no consent

### Data Use Purpose Statement
**Plain language purpose:**
> We record and store call information to help us respond to your inquiry, improve service quality, train our team, and comply with legal requirements.

### Compliance Checklist
- [x] PIPEDA requirements addressed (express consent, purpose disclosure)
- [x] PIPA (Alberta) requirements addressed
- [x] Opt-out mechanism provided (DTMF 9)
- [x] Default to NO recording if no consent
- [x] Consent obtained BEFORE recording starts
- [x] Audit logging fields defined

### Approval Status
**Current Status:** ⏳ **PENDING APPROVAL**

**Required Approvals:**
- [ ] Legal counsel review (PIPEDA/PIPA compliance)
- [ ] Business owner approval (consent language)
- [ ] Privacy officer sign-off (data retention policy)

**Approval Deadline:** [To be set by stakeholders]

**Next Steps:**
1. Share `HOTLINE_CONSENT_DRAFT.md` with legal team
2. Incorporate feedback on language
3. Obtain written sign-off from privacy officer
4. Update this checklist with approval date

### Document Reference
**Location:** `HOTLINE_CONSENT_DRAFT.md`  
**Created:** 2025-01-31  
**Legal Review:** [Pending]  
**Privacy Review:** [Pending]

## Phase HS3: Abuse Guard Documentation ✅

### Rate Limiting Strategy Documented

#### Per-ANI (Phone Number) Limits
- **Burst:** 5 calls/minute
- **Sustained:** 15 calls/hour, 50 calls/day
- **Enforcement:** Rolling window counters, exponential backoff
- **Status:** ✅ Thresholds defined

#### Per-IP (Webhook Origin) Limits
- **Burst:** 20 requests/minute
- **Sustained:** 100 requests/hour, 500 requests/day
- **Enforcement:** Edge function entry point check
- **Status:** ✅ Thresholds defined

#### System-Wide Limits
- **Concurrent calls:** 50 max
- **Hourly capacity:** 500 calls
- **Daily capacity:** 10,000 calls
- **Status:** ✅ Thresholds defined

### Backoff Schedule
| Violation # | Block Duration | Jitter | Auto-Unblock |
|------------|----------------|--------|--------------|
| 1st | 60 seconds | 0-30s | Yes |
| 2nd | 5 minutes | 0-30s | Yes |
| 3rd | 15 minutes | 0-30s | Yes |
| 4th+ | 1 hour | 0-30s | Yes |

**Status:** ✅ Schedule documented

### User Messaging (EN/FR-CA)
- **429 Rate Limit:** ✅ Drafted (English + French)
- **503 Overload:** ✅ Drafted (English + French)
- **Retry guidance:** Included in both messages
- **Contact fallback:** Email address provided

### Logging Fields Defined
| Field | Type | Purpose |
|-------|------|---------|
| `timestamp` | ISO 8601 | Event time |
| `ani_hash` | SHA256 | Caller identity (hashed) |
| `ip_hash` | SHA256 | Webhook source (hashed) |
| `decision` | Enum | allowed/blocked/warned |
| `reason` | String | Specific limit breached |
| `block_duration_sec` | Number | TTL of block |

**Status:** ✅ Schema documented

### Unblock Path
- **Automatic:** Block expires after TTL
- **Manual:** Admin can whitelist via dashboard
- **Dispute:** Email/web form for false positives
- **Status:** ✅ Process documented

### Document Reference
**Location:** `HOTLINE_ABUSE_PLAN.md`  
**Created:** 2025-01-31  
**Implementation:** NOT STARTED (design only)

## Webhook Security Validation

### To Be Validated at Implementation Time
The following security measures will be implemented when edge functions are created:

#### Twilio Signature Verification
- **Method:** X-Twilio-Signature header validation
- **Secret:** Twilio Auth Token (from environment)
- **Algorithm:** HMAC-SHA1
- **Implementation:** Edge function entry point
- **Status:** 🔒 To be validated during HS implementation

#### HTTPS Enforcement
- **Protocol:** TLS 1.2+ required
- **Certificate:** Managed by Supabase Edge Functions
- **Validation:** Automatic via platform
- **Status:** 🔒 Platform-enforced (no action required)

#### IP Allowlisting (Optional)
- **Source IPs:** Twilio webhook origins
- **Ranges:** To be obtained from Twilio documentation
- **Enforcement:** Supabase firewall rules (if supported)
- **Status:** 🔒 To be evaluated during implementation

#### Request Authentication
- **API Key:** Supabase anon key for public endpoints
- **Service Role:** For admin/internal calls only
- **JWT:** If user-scoped actions required
- **Status:** 🔒 To be configured during edge function creation

### Validation Checklist (Pre-Production)
- [ ] X-Twilio-Signature validation enabled and tested
- [ ] HTTPS endpoints verified (no HTTP fallback)
- [ ] IP allowlist configured (if applicable)
- [ ] Request size limits enforced (prevent payload bombs)
- [ ] Rate limiting active (per HS3 plan)
- [ ] Audit logging enabled for all webhook calls

## Pre-Implementation Checklist

### Documentation Complete
- [x] **HS1 Dry-Run:** All three paths documented with sequence diagrams
- [x] **HS2 Consent:** EN + FR-CA scripts ready, approval pending
- [x] **HS3 Abuse Guard:** Rate limits, backoff, messages, logging defined
- [x] **HS4 Readiness:** This checklist complete

### Approvals Pending
- [ ] **Legal:** PIPEDA/PIPA compliance sign-off for consent wording
- [ ] **Privacy Officer:** Data retention and use policy approval
- [ ] **Business Owner:** Final review of caller-facing scripts
- [ ] **Technical Lead:** Architecture review (edge functions, database schema)

### Environment Preparation
- [x] **Twilio Account:** Active and configured (per TWILIO_INTEGRATION_COMPLETE.md)
- [x] **Secrets:** TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, OPENAI_API_KEY set
- [ ] **Test Numbers:** Dedicated number(s) for staging/testing
- [ ] **Database Tables:** Schema for `consent_logs`, `rate_limit_events` created
- [ ] **Edge Functions:** Placeholder created (not yet implemented)

### Testing Strategy
- [ ] **Unit Tests:** Mock Twilio webhooks with sample payloads
- [ ] **Integration Tests:** End-to-end call flow with real Twilio sandbox
- [ ] **Load Tests:** Simulate 100 concurrent calls to validate rate limits
- [ ] **Security Tests:** Verify signature validation, replay attack prevention
- [ ] **Localization Tests:** Confirm EN/FR-CA scripts play correctly

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Create edge functions for IVR menu and consent capture
- Implement Twilio signature verification
- Set up database tables for logging
- Deploy to staging environment

### Phase 2: Call Flows (Week 2)
- Implement Support/Sales routing
- Implement AI voicemail fallback
- Test DTMF handling and timeout behavior
- Verify TwiML generation

### Phase 3: Abuse Protection (Week 3)
- Implement per-ANI rate limiting
- Implement per-IP rate limiting
- Add exponential backoff logic
- Test 429 responses

### Phase 4: Production Prep (Week 4)
- Obtain legal/privacy approvals
- Load testing and performance tuning
- Set up monitoring and alerting
- Staged rollout (internal → beta → public)

## Go/No-Go Criteria

### Required for Production Launch
- [ ] All approvals received (legal, privacy, business)
- [ ] Security validation complete (webhook signatures verified)
- [ ] Consent scripts tested in both languages
- [ ] Rate limiting tested and functional
- [ ] Monitoring dashboards configured
- [ ] Incident response plan documented
- [ ] Rollback plan prepared

### Nice-to-Have (Can Launch Without)
- [ ] Advanced ML-based anomaly detection
- [ ] Geographic call blocking (international)
- [ ] Real-time dashboard for call queue visibility
- [ ] Automated blacklist updates from threat feeds

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Consent wording rejected by legal | Medium | High | Buffer 1 week for revisions |
| Rate limits too aggressive (false positives) | Medium | Medium | Start conservative, tune based on data |
| Webhook signature validation bug | Low | High | Comprehensive testing, security review |
| High call volume on launch day | Medium | Medium | Staged rollout, capacity monitoring |
| Twilio API downtime | Low | High | Fallback message, email notification |

## Rollback Plan

If critical issues arise post-launch:
1. **Immediate:** Disable IVR, route all calls to voicemail
2. **Short-term:** Redirect to human answering service
3. **Code rollback:** Revert edge functions to previous version
4. **Communication:** Email/SMS notify customers of temporary service change

## Post-Launch Monitoring

### Key Metrics (First 48 Hours)
- Total call volume
- Consent opt-in rate (% pressing DTMF 1)
- Consent opt-out rate (% pressing DTMF 9)
- Rate limit blocks (count and ANI distribution)
- Average call duration
- Error rate (failed webhooks, timeouts)

### Alert Thresholds
- Error rate > 5%: Page on-call engineer
- Rate limit blocks > 100/hour: Review for false positives
- Consent opt-out rate > 50%: Review script wording

## Status Summary

### Overall Readiness: 80% ✅

**Complete:**
- [x] Design documentation (HS1, HS2, HS3)
- [x] Security plan (abuse guard, webhook validation)
- [x] Logging schema defined

**Pending:**
- [ ] Legal/privacy approvals (HS2)
- [ ] Database schema migration
- [ ] Edge function implementation
- [ ] Testing and validation

**Blockers:**
- ⏳ Awaiting consent wording approval from legal team

## Next Steps

1. **Submit for Approval:** Share HOTLINE_CONSENT_DRAFT.md with legal and privacy teams
2. **Begin Backend Guardian Track:** Proceed to GG1-GG4 verification phases (as per instructions)
3. **Prepare Environment:** Create database tables for consent and rate limit logging
4. **Schedule Kickoff:** Book implementation kickoff meeting once approvals received

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-31 | Initial readiness checklist | AI Assistant |

---

## Status: READY FOR REVIEW ✅

**Date:** 2025-01-31  
**Phase:** HS4 (Complete)  
**Approval Status:** Pending stakeholder review  
**Next Phase:** Backend Guardian verification (GG1-GG4)

**Ready to proceed with Backend Guardian track once approvals are obtained.**
