# Phase H-T5 — Global Hotline Expansion

**Status**: ⏳ READY (AWAITING CA STABILITY)  
**Date**: 2025-10-01  
**Phase**: H-T5 — Expand hotline to all callers globally

---

## Overview

This phase removes geographic restrictions, allowing callers from any country to access the hotline. All security layers (rate limiting, abuse guards, consent gate) remain active. This should only be activated after Canada-only mode has proven stable.

---

## Prerequisites

- ✅ Phase H-T1, H-T2, H-T3 complete
- ✅ Canada-only operation stable for 7+ days
- ✅ No critical security incidents
- ✅ Consent rate >70% (if recording enabled)
- ✅ Rate limiting working as expected
- ✅ Abuse guard thresholds confirmed effective

---

## Stability Criteria (Canada Phase)

Before proceeding to global expansion, verify:

### ✅ Call Quality
- [ ] >95% successful call completion rate
- [ ] <2% caller hangups during consent gate
- [ ] >80% IVR menu engagement (support/sales routing)
- [ ] <5% voicemail fallback rate

### ✅ Security Metrics
- [ ] Zero signature validation bypass attempts
- [ ] <1% rate limit violations
- [ ] Zero PII leakage incidents
- [ ] All audit logs complete and accurate

### ✅ Consent Metrics (If Recording Enabled)
- [ ] >70% consent rate (press 1)
- [ ] <10% opt-out rate (press 9)
- [ ] <20% timeout rate (no input)
- [ ] All consent decisions logged

### ✅ Performance
- [ ] <2s latency for IVR response
- [ ] Zero edge function errors
- [ ] Zero database connection failures
- [ ] <100ms average database query time

---

## Configuration Changes

### Disable Geo-Filtering

```sql
-- Disable Canada-only mode (allow all countries)
UPDATE public.hotline_geo_config 
SET value = false, updated_at = NOW() 
WHERE key = 'geo_filtering_enabled';

UPDATE public.hotline_geo_config 
SET value = false, updated_at = NOW() 
WHERE key = 'canada_only_mode';
```

### Verify Configuration

```sql
-- View current geo config
SELECT * FROM public.hotline_geo_config;

-- Expected output:
-- geo_filtering_enabled: false
-- canada_only_mode: false
-- allowed_country_codes: ["1"] (ignored when geo_filtering_enabled=false)
```

---

## Call Flow (Global Mode)

```
1. Incoming Call → Twilio Webhook
   ↓
2. Security Gate (Signature Validation)
   ↓
3. Rate Limit Check (per-ANI, per-IP)
   ↓
4. Allowlist Check (if applicable)
   ↓
5. ❌ GEO CHECK DISABLED (all countries allowed)
   ↓
6. Language Selection (EN/FR-CA)
   ↓
7. Consent Gate (if recording enabled)
   ↓
8. IVR Menu (DTMF: 1=Support, 2=Sales)
   ↓
9. Route to Handler or Voicemail
```

---

## Test Scenarios

### Scenario 1: US Caller (Previously Blocked)

**Input**:
```json
{
  "CallSid": "CA_test_us_global_001",
  "From": "+12125551234",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Expected (Before Global Enable)**:
- ❌ Geo-blocked (Canada-only mode)

**Expected (After Global Enable)**:
- ✅ Signature validated
- ✅ Rate limit check passed
- ✅ Geo check bypassed (global mode)
- ✅ Language selection presented

**Logs**:
```
✅ Signature validated
✅ Rate limit: 1/5 (minute)
ℹ️ Geo filtering disabled (global mode)
✅ Presenting language selection
```

---

### Scenario 2: International Caller (UK)

**Input**:
```json
{
  "CallSid": "CA_test_uk_001",
  "From": "+442071234567",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Expected**:
- ✅ Signature validated
- ✅ Rate limit check passed
- ✅ Geo check bypassed (global mode)
- ✅ Language selection presented

---

### Scenario 3: Allowlist Bypass Still Works

**Input**:
```json
{
  "CallSid": "CA_test_allowlist_global_001",
  "From": "+15878839797",
  "To": "+15551234567",
  "CallStatus": "ringing"
}
```

**Expected**:
- ✅ Signature validated
- ✅ Rate limit check passed
- ✅ ON allowlist (bypass geo check - not needed in global mode)
- ✅ Language selection presented

---

## Abuse Guard Thresholds (Global Mode)

### Rate Limiting (Unchanged)

**Per-ANI (Per Phone Number)**:
- Burst: 5 calls/minute
- Hourly: 15 calls/hour
- Daily: 50 calls/day

**Per-IP (Per Source IP)**:
- Burst: 20 calls/minute
- Hourly: 100 calls/hour
- Daily: 500 calls/day

**Exponential Backoff**:
- 1st violation: 60 seconds block
- 2nd violation: 5 minutes block
- 3rd violation: 15 minutes block
- 4th+ violation: 1 hour block

### Friendly 429 Messages (EN/FR-CA)

**English**:
```
"We're currently experiencing high call volume. Please try again in a few minutes. Thank you for your patience."
```

**French (FR-CA)**:
```
"Nous connaissons actuellement un volume d'appels élevé. Veuillez réessayer dans quelques minutes. Merci de votre patience."
```

---

## Monitoring Queries (Global Mode)

### Global Call Activity

```sql
-- Calls by country (inferred from country code)
SELECT 
  SUBSTRING(ani_hash FROM 1 FOR 2) as country_hint,
  COUNT(*) as total_calls,
  COUNT(DISTINCT ani_hash) as unique_callers,
  COUNT(*) FILTER (WHERE consent_given = true) as consented,
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))), 2) as avg_duration_seconds
FROM public.hotline_call_sessions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY SUBSTRING(ani_hash FROM 1 FOR 2)
ORDER BY total_calls DESC;
```

### Rate Limit Violations (Global)

```sql
-- Rate limit violations by source
SELECT 
  'ANI' as source_type,
  COUNT(*) as violations,
  COUNT(DISTINCT ani_hash) as unique_sources
FROM public.hotline_rate_limit_ani
WHERE block_until > NOW()
UNION ALL
SELECT 
  'IP' as source_type,
  COUNT(*) as violations,
  COUNT(DISTINCT ip_hash) as unique_sources
FROM public.hotline_rate_limit_ip
WHERE block_until > NOW();
```

### Security Alerts (Global)

```sql
-- Security alerts by type (past 24 hours)
SELECT 
  alert_type,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM public.security_alerts
WHERE created_at > NOW() - INTERVAL '24 hours'
AND alert_type LIKE 'hotline%'
GROUP BY alert_type
ORDER BY count DESC;
```

---

## Security Validation (Global Mode)

### ✅ All Security Layers Active
- [ ] Signature validation enforced
- [ ] Rate limiting active (per-ANI, per-IP)
- [ ] Abuse guards functional
- [ ] Consent gate working (if recording enabled)
- [ ] Audit logging complete

### ✅ No Geo-Restrictions
- [ ] Calls from all countries accepted
- [ ] No geo-blocking in logs
- [ ] Allowlist still works (bypass mechanism retained)

### ✅ Performance Under Load
- [ ] <2s IVR response time
- [ ] <1% edge function errors
- [ ] <100ms database query latency
- [ ] Zero timeout errors

---

## Known Risks (Global Mode)

### 1. Increased Call Volume
- **Risk**: Abuse, spam, or bot calls
- **Mitigation**: Rate limiting, abuse guards, exponential backoff

### 2. International Abuse
- **Risk**: High-volume international spam campaigns
- **Mitigation**: Per-ANI limits, blocklist (manual), Twilio fraud detection

### 3. Language Support
- **Risk**: Callers from non-English/French regions
- **Mitigation**: Currently only EN/FR-CA supported (future: add more languages)

### 4. Timezone Coverage
- **Risk**: 24/7 support expectations
- **Mitigation**: Voicemail fallback, clear office hours in greeting

---

## Rollback Procedure

### Emergency Rollback (Full Disable)

```bash
# Disable hotline entirely
HOTLINE_ENABLED=false
```

### Revert to Canada-Only

```sql
-- Re-enable Canada-only mode
UPDATE public.hotline_geo_config 
SET value = true, updated_at = NOW() 
WHERE key = 'geo_filtering_enabled';

UPDATE public.hotline_geo_config 
SET value = true, updated_at = NOW() 
WHERE key = 'canada_only_mode';
```

### Revert to Allowlist-Only

```sql
-- Disable geo-filtering (allowlist-only)
UPDATE public.hotline_geo_config 
SET value = false, updated_at = NOW() 
WHERE key = 'geo_filtering_enabled';
```

---

## Post-Launch Monitoring (First 24 Hours)

### Hourly Checks
- [ ] Call volume trends
- [ ] Rate limit violations
- [ ] Security alerts
- [ ] Consent rate (if recording enabled)
- [ ] Edge function errors

### Daily Checks
- [ ] Call completion rate
- [ ] Average call duration
- [ ] IVR engagement rate
- [ ] Voicemail fallback rate
- [ ] Abuse patterns

---

## Success Criteria

- [ ] >95% call completion rate (global)
- [ ] <2% rate limit violation rate
- [ ] Zero security incidents
- [ ] >70% consent rate (if recording enabled)
- [ ] <5% caller hangups during IVR
- [ ] <100ms database query latency

---

## Next Steps (Post-Launch)

1. ✅ Monitor first 24 hours closely
2. ✅ Review security logs for abuse patterns
3. ✅ Adjust rate limits if needed (based on legitimate usage)
4. ⏳ Add additional language support (future enhancement)
5. ⏳ Implement time-based routing (office hours vs. voicemail)
6. ⏳ Integrate with CRM for lead capture

---

**Phase H-T5 Status**: Ready for global expansion once Canada-only stability is confirmed (7+ days stable operation).
