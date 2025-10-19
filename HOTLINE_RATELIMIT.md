# Phase H5 — Hotline Rate Limiting & Abuse Prevention

## Threat Model

### Attack Vectors
1. **Call Flooding** - Attacker dials hotline repeatedly to DoS phone lines
2. **Webhook Spam** - Direct HTTP requests to webhook endpoints (bypassing Twilio)
3. **Voicemail Bombing** - Leaving hundreds of voicemail recordings to consume storage
4. **DTMF Fuzzing** - Rapid menu navigation to exhaust compute resources
5. **Toll Fraud** - Using hotline as relay to place expensive international calls

## Rate Limiting Strategy

### Layer 1: Twilio-Level Controls (Recommended)
**Configure in Twilio Console:**
- **Concurrent call limit:** 5 simultaneous calls max
- **Geographic permissions:** Canada + USA only (block international)
- **Voice Insights:** Enable fraud detection alerts

**Configuration URL:**  
https://console.twilio.com/us1/develop/phone-numbers/manage/incoming/PN.../configure

### Layer 2: Edge Function Rate Limits

#### Per-ANI (Caller Phone Number) Limits
**Threshold:** 10 calls per hour per ANI (Automatic Number Identification)

**Implementation:**
```typescript
// supabase/functions/voice-answer/index.ts
const From = formData.get('From') as string;
const rateLimitKey = `hotline:ani:${From}`;

// Check recent call count
const { data: recentCalls, error } = await supabase
  .from('call_lifecycle')
  .select('call_sid')
  .eq('from_number', From)
  .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

if (recentCalls && recentCalls.length >= 10) {
  console.warn(`Rate limit exceeded for ANI ${From}: ${recentCalls.length} calls in last hour`);
  
  // Log rate limit event
  await supabase.from('analytics_events').insert({
    event_type: 'rate_limit_exceeded',
    event_data: { 
      ani: From, 
      call_count: recentCalls.length,
      threshold: 10 
    },
    severity: 'warning'
  });

  // Return 429 TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    You have reached the maximum number of calls allowed. 
    Please try again later or contact us via email.
  </Say>
  <Hangup/>
</Response>`;
  
  return new Response(twiml, {
    status: 429, // Too Many Requests
    headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
  });
}
```

#### Per-IP Limits (Webhook Protection)
**Threshold:** 30 requests per minute per IP

**Implementation:**
```typescript
const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('cf-connecting-ip') || 
                 'unknown';

const rateLimitKey = `hotline:ip:${clientIP}`;

// Query rate_limits table
const { data: rateLimitData } = await supabase
  .from('rate_limits')
  .select('request_count')
  .eq('identifier', rateLimitKey)
  .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString());

const requestCount = rateLimitData?.length || 0;

if (requestCount >= 30) {
  console.error(`IP rate limit exceeded: ${clientIP} (${requestCount} requests/min)`);
  
  return new Response('Too Many Requests', {
    status: 429,
    headers: { 
      ...corsHeaders,
      'Retry-After': '60' // Retry after 1 minute
    }
  });
}

// Record this request
await supabase.from('rate_limits').insert({
  identifier: rateLimitKey,
  endpoint: '/voice-answer',
  created_at: new Date().toISOString()
});
```

### Layer 3: Global Endpoint Limits

#### Voice Answer Endpoint
- **Limit:** 100 calls/hour globally
- **Response:** 503 Service Unavailable (temporary)

#### Menu Handler Endpoint
- **Limit:** 200 requests/hour globally
- **Response:** 503 Service Unavailable (temporary)

#### Voicemail Endpoint
- **Limit:** 50 recordings/hour globally
- **Response:** "Voicemail is temporarily unavailable. Please call back later."

## Rate Limit Table Schema

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- 'hotline:ani:+15551234567' or 'hotline:ip:1.2.3.4'
  endpoint TEXT NOT NULL,   -- '/voice-answer', '/voice-menu-handler', etc.
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, created_at);

-- Auto-cleanup old records (>1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run every 5 minutes)
-- Note: Use pg_cron or external scheduler
```

## 429 Response Behavior

### TwiML 429 Response (Caller Rate Limited)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    You have reached the maximum number of calls allowed. 
    Please try again in one hour or contact us via email at 
    support at tradeline247ai.com.
  </Say>
  <Pause length="2"/>
  <Say>Goodbye.</Say>
  <Hangup/>
</Response>
```

### HTTP 429 Response (Webhook Rate Limited)
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698765432

{
  "error": "Rate limit exceeded",
  "retry_after_seconds": 60
}
```

## Monitoring & Alerting

### Metrics to Track
| Metric | Threshold | Action |
|--------|-----------|--------|
| Total calls/hour | >80 | Alert ops team |
| Rate limits triggered | >10/hour | Investigate source IPs |
| Unique ANIs rate limited | >5/hour | Check for attack pattern |
| 429 responses | >5% of calls | Review thresholds |
| Concurrent calls | >4 | Alert (near limit) |

### Supabase Analytics Events
```typescript
// Log rate limit event
await supabase.from('analytics_events').insert({
  event_type: 'rate_limit_exceeded',
  event_data: {
    identifier: rateLimitKey,
    endpoint: '/voice-answer',
    threshold: 10,
    actual_count: requestCount,
    action: 'rejected'
  },
  severity: 'warning'
});
```

### Dashboard Queries
```sql
-- Rate limit violations in last 24 hours
SELECT 
  event_data->>'identifier' AS identifier,
  event_data->>'endpoint' AS endpoint,
  COUNT(*) AS violation_count
FROM analytics_events
WHERE event_type = 'rate_limit_exceeded'
  AND created_at > now() - INTERVAL '24 hours'
GROUP BY event_data->>'identifier', event_data->>'endpoint'
ORDER BY violation_count DESC;
```

## Bypass Mechanism (Emergency)

### Allowlist for Trusted Numbers
```typescript
// Define allowlisted ANIs (e.g., internal testing numbers)
const ALLOWLIST = [
  '+14319900222', // Business owner
  '+15877428885'  // Our own hotline (for testing)
];

if (ALLOWLIST.includes(From)) {
  console.log(`Allowlisted ANI ${From} - bypassing rate limit`);
  // Skip rate limit check
}
```

### Admin Override (Temporary)
```sql
-- Manually clear rate limit for specific ANI
DELETE FROM rate_limits WHERE identifier = 'hotline:ani:+15551234567';
```

## Abuse Pattern Detection

### Pattern 1: Sequential Call Attacks
```sql
-- Detect calls from sequential phone numbers (likely spoofed)
SELECT 
  from_number,
  COUNT(*) AS call_count
FROM call_lifecycle
WHERE created_at > now() - INTERVAL '10 minutes'
GROUP BY from_number
HAVING COUNT(*) > 3
ORDER BY call_count DESC;
```

### Pattern 2: Short-Duration Hangs (Harassment)
```sql
-- Detect callers who hang up immediately (before menu)
SELECT 
  from_number,
  COUNT(*) AS hangup_count
FROM call_lifecycle
WHERE call_duration < 5 -- Less than 5 seconds
  AND created_at > now() - INTERVAL '1 hour'
GROUP BY from_number
HAVING COUNT(*) > 5;
```

### Pattern 3: Voicemail Spam
```sql
-- Detect excessive voicemail recordings from same ANI
SELECT 
  from_number,
  COUNT(*) AS voicemail_count
FROM call_lifecycle
WHERE recording_url IS NOT NULL
  AND created_at > now() - INTERVAL '1 day'
GROUP BY from_number
HAVING COUNT(*) > 5;
```

## Cost Protection (Toll Fraud Prevention)

### Block International Calls
```typescript
// Only allow North American numbers (+1 country code)
const allowedCountryCode = '+1';
if (!From.startsWith(allowedCountryCode) || !To.startsWith(allowedCountryCode)) {
  console.warn(`International call attempt blocked: ${From} → ${To}`);
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    This hotline only accepts calls from North America. 
    For international support, please email us.
  </Say>
  <Hangup/>
</Response>`;
  
  return new Response(twiml, {
    headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
  });
}
```

### Daily Spend Alert (Twilio)
```
Configure in Twilio Console:
Alerts → Usage Triggers → Create New Trigger
- When: Voice Usage exceeds $50
- Frequency: Daily
- Notification: Email to ops@tradeline247ai.com
```

## Testing Scenarios

### Test 1: Per-ANI Rate Limit
```bash
# Call 11 times in quick succession from same number
for i in {1..11}; do
  curl -X POST "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-answer" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data "CallSid=CA${i}&From=%2B15551234567&To=%2B15877428885"
done

# Expected: First 10 succeed, 11th returns 429 with rate limit message
```

### Test 2: Per-IP Rate Limit
```bash
# Simulate 31 rapid webhook requests from same IP
for i in {1..31}; do
  curl -X POST "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-answer" \
    -H "X-Forwarded-For: 203.0.113.42"
done

# Expected: First 30 succeed, 31st returns 429 HTTP status
```

### Test 3: Allowlist Bypass
```bash
# Call from allowlisted number 15 times
for i in {1..15}; do
  curl -X POST "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-answer" \
    --data "CallSid=CA${i}&From=%2B14319900222&To=%2B15877428885"
done

# Expected: All 15 succeed (no rate limit)
```

## Incident Response Playbook

### Scenario: Call Flooding Attack
1. **Detect:** Monitor dashboard shows >80 calls/hour
2. **Investigate:** Check `rate_limits` table for top offenders
3. **Block:** Add offending ANIs to blocklist (manual)
4. **Escalate:** If persistent, contact Twilio support to block at carrier level
5. **Document:** Log incident in `analytics_events` with severity='critical'

### Scenario: Webhook DDoS
1. **Detect:** High 429 response rate from single IP
2. **Block:** Add IP to Supabase WAF rules (if available) or Cloudflare
3. **Verify:** Ensure legitimate Twilio IPs are allowlisted
4. **Monitor:** Watch for IP rotation attempts

## Next Steps (H6)
Simulate test calls and verify all rate limiting behaviors work correctly.

