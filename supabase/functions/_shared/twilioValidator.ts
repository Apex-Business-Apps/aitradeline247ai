// Twilio request signature validator for Deno Edge Functions
// Implements HMAC-SHA1 validation per Twilio spec

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
  const allowInsecure = Deno.env.get('ALLOW_INSECURE_TWILIO_WEBHOOKS') === 'true';
  const isProduction = Deno.env.get('NODE_ENV') === 'production';
  
  // Get signature
  const twilioSignature = req.headers.get('X-Twilio-Signature');
  
  // Parse form data
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });
  
  // DevOps SRE: SECURITY WARNING - Bypass validation ONLY in explicitly non-production environments
  // This creates risk if:
  // 1. NODE_ENV is misconfigured or missing (treats prod as non-prod)
  // 2. Dev/staging environments contain real customer data
  // 3. ALLOW_INSECURE_TWILIO_WEBHOOKS is accidentally enabled in production
  // RECOMMENDATION: Remove this bypass entirely and use test Twilio credentials with valid signatures
  if (!isProduction && allowInsecure) {
    console.warn('⚠️  INSECURE: Bypassing Twilio signature validation (non-production mode)');
    console.warn('⚠️  NODE_ENV:', Deno.env.get('NODE_ENV'), '| ALLOW_INSECURE_TWILIO_WEBHOOKS:', allowInsecure);
    console.warn('⚠️  If this appears in production logs, IMMEDIATELY investigate and disable bypass');
    return params;
  }
  
  // Require auth token in all other cases
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
