# Phase HS3 — Abuse Guard & Rate Limiting (Design Only)

## Objective
Document protection strategies for IVR endpoints against abuse, spam, and denial-of-service attacks.

## Threat Model

### Attack Vectors
1. **Call Flooding**: Attacker places excessive calls to block legitimate callers
2. **DTMF Spam**: Rapid key presses to exhaust system resources
3. **Voicemail Bombing**: Automated systems leave spam messages
4. **Toll Fraud**: Exploitation to generate revenue share from premium numbers
5. **Reconnaissance**: Automated probing to map system behavior

### Abuse Patterns
- **Single Source**: High volume from one ANI (phone number)
- **Distributed**: Low volume from many ANIs (harder to detect)
- **Burst**: Rapid spike in calls over short period
- **Sustained**: Gradual increase over hours/days

## Rate Limiting Strategy

### Limits by Identifier

#### Per ANI (Phone Number)
**Burst Limit:**
- **5 calls per minute** (allows legitimate retries)
- **15 calls per hour** (prevents sustained abuse)
- **50 calls per day** (catches automated systems)

**Enforcement:**
- Count calls from same ANI using rolling window
- Block on threshold breach, return 429 status
- Reset counter after window expires

**Pseudocode:**
```typescript
interface CallRateLimit {
  ani_hash: string;
  calls_per_minute: number;
  calls_per_hour: number;
  calls_per_day: number;
  last_call_at: Date;
  blocked_until?: Date;
}

const isANIBlocked = (ani: string): boolean => {
  const limits = getRateLimitForANI(sha256(ani));
  if (limits.calls_per_minute > 5) return true;
  if (limits.calls_per_hour > 15) return true;
  if (limits.calls_per_day > 50) return true;
  return false;
};
```

#### Per IP Address (Webhook Origin)
**Burst Limit:**
- **20 requests per minute** (allows parallel calls)
- **100 requests per hour**
- **500 requests per day**

**Enforcement:**
- Track IP of incoming webhook requests
- Apply rate limit at edge function entry point
- Return 429 with Retry-After header

**Pseudocode:**
```typescript
interface IPRateLimit {
  ip_hash: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  blocked_until?: Date;
}

const checkIPRateLimit = (ip: string): RateLimitResult => {
  const limits = getRateLimitForIP(sha256(ip));
  if (limits.requests_per_minute > 20) {
    return { allowed: false, retryAfter: 60 };
  }
  return { allowed: true };
};
```

### Combined Limits (System-Wide)

**Global Thresholds:**
- **50 concurrent calls** across all ANIs
- **500 calls per hour** system-wide
- **10,000 calls per day** system-wide

**Purpose:** Protect against distributed attacks and ensure capacity for legitimate users.

## Backoff & Jitter Schedule

### Exponential Backoff
When a caller/IP is rate-limited:

1. **First block:** 60 seconds (1 minute)
2. **Second block:** 300 seconds (5 minutes)
3. **Third block:** 900 seconds (15 minutes)
4. **Fourth+ block:** 3600 seconds (1 hour)

**Jitter:** Add random 0-30 seconds to prevent thundering herd on unblock.

### Pseudocode
```typescript
const calculateBlockDuration = (violationCount: number): number => {
  const baseDurations = [60, 300, 900, 3600]; // seconds
  const duration = baseDurations[Math.min(violationCount - 1, 3)];
  const jitter = Math.floor(Math.random() * 30); // 0-30s
  return duration + jitter;
};
```

### Unblock Path
**Automatic Unblock:**
- After block TTL expires, counter resets to zero
- Caller can retry immediately
- If abuse continues, block escalates

**Manual Unblock (Admin Only):**
- Admin can whitelist specific ANI via dashboard
- Whitelist bypasses all rate limits
- Useful for legitimate high-volume customers (e.g., call centers)

**Dispute Resolution:**
- Blocked callers can contact support via email/web
- Support verifies legitimacy and removes block
- Log all manual interventions for audit

## User-Facing Messages

### English (EN)

#### 429 Rate Limit Exceeded
```
We're sorry, but we've detected an unusual number of calls from your number.

For security reasons, your calls are temporarily on hold.

Please try again in [X minutes], or contact us at info@tradeline247ai.com if you believe this is an error.

Thank you for your understanding.
```

#### 503 System Overload
```
We're experiencing high call volume at the moment.

All of our lines are currently busy. Please try your call again in a few minutes.

For immediate assistance, you can email us at info@tradeline247ai.com.

We apologize for the inconvenience.
```

### French Canadian (FR-CA)

#### 429 Rate Limit Exceeded
```
Nous sommes désolés, mais nous avons détecté un nombre inhabituel d'appels de votre numéro.

Pour des raisons de sécurité, vos appels sont temporairement suspendus.

Veuillez réessayer dans [X minutes], ou contactez-nous à info@tradeline247ai.com si vous pensez qu'il s'agit d'une erreur.

Merci de votre compréhension.
```

#### 503 System Overload
```
Nous connaissons actuellement un volume d'appels élevé.

Toutes nos lignes sont occupées. Veuillez réessayer votre appel dans quelques minutes.

Pour une assistance immédiate, vous pouvez nous envoyer un courriel à info@tradeline247ai.com.

Nous nous excusons pour cet inconvénient.
```

### TwiML Response (Reference Only)

```xml
<!-- 429 Rate Limit Response -->
<Response>
  <Say language="en-CA" voice="Polly.Joanna">
    We're sorry, but we've detected an unusual number of calls from your number.
    Please try again in 5 minutes, or contact us via email if this is urgent.
  </Say>
  <Hangup/>
</Response>
```

## Logging Requirements

### Log Entry Fields
Every rate-limit decision MUST log:

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `timestamp` | ISO 8601 | When decision was made | `2025-01-31T14:23:45.123Z` |
| `ani_hash` | SHA256 | Caller's phone (hashed) | `sha256:abc123...` |
| `ip_hash` | SHA256 | Webhook origin IP (hashed) | `sha256:def456...` |
| `decision` | Enum | `allowed`, `blocked`, `warned` | `blocked` |
| `reason` | String | Why blocked | `burst_limit_ani` |
| `threshold` | Number | Limit that was breached | `5` |
| `current_count` | Number | Actual count | `7` |
| `block_duration_sec` | Number | TTL of block | `300` |
| `retry_after` | ISO 8601 | When to unblock | `2025-01-31T14:28:45.123Z` |
| `violation_count` | Number | Escalation counter | `2` |

### Sample Log Entry
```json
{
  "event_type": "rate_limit_decision",
  "timestamp": "2025-01-31T14:23:45.123Z",
  "call_sid": "CA1234567890abcdef",
  "ani_hash": "sha256:a1b2c3d4e5f6...",
  "ip_hash": "sha256:f6e5d4c3b2a1...",
  "decision": "blocked",
  "reason": "burst_limit_ani",
  "threshold": 5,
  "current_count": 7,
  "block_duration_sec": 300,
  "retry_after": "2025-01-31T14:28:45.123Z",
  "violation_count": 2,
  "severity": "warning"
}
```

### Logging Destinations
1. **Supabase `analytics_events` table**: Primary audit log
2. **Twilio logs**: For webhook debugging
3. **Real-time alerting**: For critical thresholds (e.g., DDoS)

## Detection & Alerting

### Anomaly Detection Triggers
**Alert when:**
- Single ANI exceeds 10 calls/minute (likely bot)
- 50+ unique ANIs call within 5 minutes (DDoS)
- System-wide call volume 3x above baseline (flash crowd or attack)
- Same IP sends 100+ requests/minute (webhook flood)

### Alert Channels
- **Email:** Notify admin immediately
- **Slack/Discord:** Post to #ops-alerts channel
- **SMS:** For critical incidents only (optional)

### Alert Message Template
```
[ALERT] IVR Rate Limit Breach
Type: Burst limit exceeded
Source: ANI sha256:abc123...
Count: 12 calls in 1 minute (limit: 5)
Action: Blocked for 5 minutes
Review: https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/editor
```

## Temporary Block TTLs

| Violation Level | Block Duration | Auto-Unblock | Manual Override |
|----------------|----------------|--------------|-----------------|
| First | 60 seconds | Yes | Yes |
| Second | 5 minutes | Yes | Yes |
| Third | 15 minutes | Yes | Yes |
| Fourth+ | 1 hour | Yes | Yes |
| Persistent Abuse (10+ violations) | 24 hours | Yes | Admin only |

**Permanent Bans:**
- Reserved for extreme cases (e.g., verified fraud, harassment)
- Requires manual admin action
- Documented in security incident report

## Whitelist / Blacklist Management

### Whitelist (Allow Always)
**Use cases:**
- Verified business partners (e.g., referral partners)
- Internal testing numbers
- VIP customers with legitimate high call volume

**Implementation:**
```typescript
interface Whitelist {
  ani_hash: string;
  reason: string;
  added_by: string;
  added_at: Date;
  expires_at?: Date;
}

const isWhitelisted = (ani: string): boolean => {
  return whitelistDB.exists(sha256(ani));
};
```

### Blacklist (Block Always)
**Use cases:**
- Confirmed spam/fraud ANIs
- Abusive callers (e.g., harassment)
- Premium rate numbers (toll fraud prevention)

**Implementation:**
```typescript
interface Blacklist {
  ani_hash: string;
  reason: string;
  added_by: string;
  added_at: Date;
  severity: 'spam' | 'fraud' | 'abuse';
}

const isBlacklisted = (ani: string): boolean => {
  return blacklistDB.exists(sha256(ani));
};
```

## Privacy Considerations

### ANI Hashing
- **Never store raw phone numbers** in rate limit logs
- Use SHA256 hash with rotating salt (daily)
- Allows rate limiting without PII exposure

### IP Anonymization
- Hash IP addresses before logging
- Remove last octet for IPv4 (e.g., 192.0.2.x)
- Mask last 64 bits for IPv6

### Data Retention
- **Rate limit logs:** 30 days
- **Block events:** 90 days (for pattern analysis)
- **Whitelist/blacklist:** Indefinite (or until manual removal)

## Testing Strategy

### Load Testing
- **Burst test:** 100 calls in 10 seconds from single ANI
- **Sustained test:** 1000 calls over 1 hour from distributed ANIs
- **Stress test:** 500 concurrent calls to find system limits

### Expected Results
- [ ] Burst calls blocked after 5th call within 1 minute
- [ ] Blocked caller receives 429 message in correct language
- [ ] Rate limit logs capture all block events
- [ ] Admin can manually unblock via dashboard
- [ ] Whitelisted ANI bypasses all limits

## Implementation Phases

### Phase 1: Basic Rate Limiting (Required)
- Per-ANI burst protection (5/min, 15/hour)
- Simple block with fixed 5-minute TTL
- Log to Supabase `analytics_events`

### Phase 2: Advanced Protection (Recommended)
- Exponential backoff with jitter
- IP-based rate limiting
- Real-time alerting on anomalies

### Phase 3: Intelligence Layer (Future)
- ML-based anomaly detection
- Automatic blacklist updates from threat feeds
- Geographic blocking (e.g., block international if not needed)

## Status: DESIGN COMPLETE ✅

**Date:** 2025-01-31  
**Phase:** HS3  
**Implementation:** NOT STARTED (design only)  
**Next Phase:** HS4 - Readiness checklist

---

## Appendix: Rate Limit Headers (Reference)

When returning 429 from webhook, include standard headers:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 300
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1738334925
X-RateLimit-Policy: per-ani-burst
```

These headers help clients understand:
- How long to wait before retrying (`Retry-After`)
- What limit was breached (`X-RateLimit-Policy`)
- When the limit resets (`X-RateLimit-Reset`)
