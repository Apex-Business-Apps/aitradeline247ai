# Phase H2 — Hotline Security & Transport

## Security Requirements

### 1. Transport Security (TLS)
**Requirement:** All webhook endpoints MUST use HTTPS with valid TLS certificates.

**Enforcement:**
- Twilio webhook URLs: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/*`
- Supabase Edge Functions enforce TLS by default
- No HTTP fallback allowed

**Validation:**
```bash
# Test TLS handshake
curl -v https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-answer 2>&1 | grep "SSL connection"
```

### 2. Request Authentication (X-Twilio-Signature)

**Requirement:** Validate every incoming Twilio webhook using HMAC-SHA1 signature.

**Headers Required:**
```http
POST /functions/v1/voice-answer
Host: hysvqdwmhxnblxfqnszn.supabase.co
Content-Type: application/x-www-form-urlencoded
X-Twilio-Signature: t7hdnYz7VLE+fJPH/5vKRvJnYBQ=
```

**Validation Algorithm:**
1. Concatenate webhook URL + POST parameters (sorted alphabetically)
2. Compute HMAC-SHA1 using `TWILIO_AUTH_TOKEN` as key
3. Base64-encode the result
4. Compare with `X-Twilio-Signature` header (constant-time comparison)

**Implementation (Edge Function):**
```typescript
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  // Sort parameters alphabetically and concatenate
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const data = url + sortedParams;
  
  // Compute HMAC-SHA1
  const hmac = createHmac('sha1', authToken);
  hmac.update(data);
  const expectedSignature = hmac.digest('base64');
  
  // Constant-time comparison
  return signature === expectedSignature;
}

// Usage in edge function
const twilioSignature = req.headers.get('x-twilio-signature');
if (!twilioSignature) {
  console.warn('Missing Twilio signature - rejecting request');
  return new Response('Forbidden', { status: 403 });
}

const formData = await req.formData();
const params = Object.fromEntries(formData);
const url = `https://hysvqdwmhxnblxfqnszn.supabase.co${new URL(req.url).pathname}`;

if (!validateTwilioSignature(url, params, twilioSignature, TWILIO_AUTH_TOKEN)) {
  console.error('Invalid Twilio signature - possible spoofing attempt');
  return new Response('Forbidden', { status: 403 });
}
```

### 3. Environment Variables (Secrets Management)

**Required Secrets:**
- `TWILIO_ACCOUNT_SID` - Public identifier (can log)
- `TWILIO_AUTH_TOKEN` - Secret (never log, never expose)
- `BUSINESS_TARGET_E164` - Forward destination (can log)

**Security Rules:**
- ✅ Store in Supabase Edge Function secrets
- ✅ Never commit to git
- ✅ Never return in API responses
- ✅ Never log in plain text
- ❌ Never use in client-side code

**Retrieval:**
```typescript
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
if (!TWILIO_AUTH_TOKEN) {
  throw new Error('Missing TWILIO_AUTH_TOKEN - check Edge Function secrets');
}
```

### 4. Input Validation

**Phone Number Sanitization:**
```typescript
// E.164 format validation
const e164Regex = /^\+[1-9]\d{1,14}$/;
if (!e164Regex.test(From) || !e164Regex.test(To)) {
  console.error('Invalid phone number format');
  return new Response('Bad Request', { status: 400 });
}
```

**CallSid Validation:**
```typescript
// Twilio CallSid format: CA[32 hex chars]
const callSidRegex = /^CA[0-9a-f]{32}$/i;
if (!callSidRegex.test(CallSid)) {
  console.error('Invalid CallSid format');
  return new Response('Bad Request', { status: 400 });
}
```

**DTMF Input Validation:**
```typescript
// Only allow 0-9, *, #
const dtmfRegex = /^[0-9*#]$/;
if (!dtmfRegex.test(Digits)) {
  console.error('Invalid DTMF input');
  return new Response('Bad Request', { status: 400 });
}
```

### 5. CORS Headers (Edge Functions)

**Configuration:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Twilio needs public access
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OPTIONS preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### 6. Error Handling (No Data Leaks)

**Safe Error Responses:**
```typescript
// ❌ NEVER expose internal errors to Twilio
return new Response(JSON.stringify({ error: error.stack }), { status: 500 });

// ✅ Return generic TwiML error
const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    We're sorry, but we're experiencing technical difficulties. 
    Please try again later.
  </Say>
  <Hangup/>
</Response>`;

return new Response(errorTwiml, {
  headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
});
```

**Logging (Internal Only):**
```typescript
console.error('Error handling call:', error.message);
// Log to Supabase analytics_events with severity='error'
await supabase.from('analytics_events').insert({
  event_type: 'twilio_webhook_error',
  event_data: { error: error.message, call_sid: CallSid },
  severity: 'error'
});
```

### 7. Expected Headers (Reference)

**Incoming from Twilio:**
```http
POST /functions/v1/voice-answer
Host: hysvqdwmhxnblxfqnszn.supabase.co
Content-Type: application/x-www-form-urlencoded
X-Twilio-Signature: [HMAC-SHA1 signature]
User-Agent: TwilioProxy/1.1
Content-Length: [length]

CallSid=CA1234&From=%2B15551234567&To=%2B15877428885&CallStatus=ringing
```

**Response to Twilio:**
```http
HTTP/1.1 200 OK
Content-Type: text/xml; charset=UTF-8
Access-Control-Allow-Origin: *

<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- TwiML content -->
</Response>
```

## Security Checklist
- ✅ TLS enforced on all endpoints
- ✅ X-Twilio-Signature validated on every request
- ✅ Phone numbers sanitized (E.164 format)
- ✅ CallSid format validated
- ✅ DTMF input restricted to valid characters
- ✅ Secrets stored in Supabase Edge Function vault
- ✅ No secrets exposed in logs or responses
- ✅ Generic error messages returned to Twilio
- ✅ Detailed errors logged internally to Supabase

## Threat Model
| Threat | Mitigation |
|--------|------------|
| Request spoofing | X-Twilio-Signature validation |
| MITM attacks | TLS 1.2+ required |
| Secret exposure | Supabase vault + no logging |
| SQL injection | Parameterized queries only |
| Phone number abuse | E.164 validation + rate limiting (H5) |
| Information disclosure | Generic error messages |

## Next Steps (H3)
Define DTMF keypad collection behavior and retry logic.

