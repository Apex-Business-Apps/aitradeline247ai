// Twilio request signature validator for Deno Edge Functions
// Implements HMAC-SHA1 validation per Twilio spec

const isProd = Deno.env.get('NODE_ENV') === 'production';
const allowInsecure = Deno.env.get('ALLOW_INSECURE_TWILIO_WEBHOOKS') === 'true';

/**
 * Validates Twilio webhook signature
 * @param url Full webhook URL including query string
 * @param params Form parameters from request body
 * @param signature X-Twilio-Signature header value
 * @param authToken TWILIO_AUTH_TOKEN from env
 * @returns true if signature is valid
 */
export async function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): Promise<boolean> {
  // Sort parameters alphabetically and concatenate
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const data = url + sortedParams;
  
  // Compute HMAC-SHA1
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );
  
  // Convert to base64
  const signatureArray = new Uint8Array(signatureBuffer);
  const base64Signature = btoa(String.fromCharCode(...signatureArray));
  
  // Constant-time comparison
  return base64Signature === signature;
}

/**
 * Validates Twilio request or rejects with 401
 * @param req Request object
 * @param url Full webhook URL
 * @returns Parsed form parameters or throws Response
 */
export async function validateTwilioRequest(
  req: Request,
  url: string
): Promise<Record<string, string>> {
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  
  // 🚫 PRODUCTION HARDENING: Block bypass in production regardless of env var
  if (isProd && allowInsecure) {
    console.error('❌ SECURITY VIOLATION: ALLOW_INSECURE_TWILIO_WEBHOOKS is true in production');
    throw new Response('Security configuration error', { status: 500 });
  }
  
  // Get signature
  const twilioSignature = req.headers.get('X-Twilio-Signature');
  
  // Parse form data
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });
  
  // Optional: IP allowlist for defense-in-depth
  const ipAllowlist = (Deno.env.get('TWILIO_IP_ALLOWLIST') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  if (isProd && ipAllowlist.length > 0) {
    const clientIp = req.headers.get('x-forwarded-for') ?? 
                     req.headers.get('cf-connecting-ip') ?? 
                     'unknown';
    
    if (!ipAllowlist.some(allowed => clientIp.includes(allowed))) {
      console.error(`❌ SECURITY: IP ${clientIp} not in Twilio allowlist`);
      throw new Response('Forbidden', { status: 403 });
    }
  }
  
  // DevOps: ONLY allow bypass in non-production with explicit flag
  // This bypass MUST NEVER appear in production logs
  if (!isProd && allowInsecure) {
    console.warn('⚠️  DEV MODE: Bypassing Twilio signature validation');
    console.warn('⚠️  NODE_ENV:', Deno.env.get('NODE_ENV'));
    return params;
  }
  
  // Production path: require auth token and valid signature
  if (!authToken) {
    console.error('Missing TWILIO_AUTH_TOKEN in environment');
    throw new Response('Unauthorized: Missing auth token', { status: 401 });
  }
  
  if (!twilioSignature) {
    console.error('Missing X-Twilio-Signature header');
    throw new Response('Unauthorized: Missing signature', { status: 401 });
  }
  
  // Validate signature
  const isValid = await validateTwilioSignature(
    url,
    params,
    twilioSignature,
    authToken
  );
  
  if (!isValid) {
    console.error('Invalid Twilio signature - possible spoofing attempt');
    throw new Response('Unauthorized: Invalid signature', { status: 401 });
  }
  
  return params;
}

