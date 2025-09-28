import crypto from 'crypto';

const SECRET = process.env.EMAIL_SIGNING_SECRET;

if (!SECRET) {
  throw new Error('EMAIL_SIGNING_SECRET environment variable is required');
}

/**
 * Sign a payload object with HMAC-SHA256
 * @param {Object} payloadObj - Object containing callSid, toE164, etc.
 * @param {number} expDays - Expiration days from now (default: 7)
 * @returns {string} - Token as base64url(payload).base64url(hmac)
 */
export function sign(payloadObj, expDays = 7) {
  const payload = {
    ...payloadObj,
    exp: Math.floor(Date.now() / 1000) + (expDays * 24 * 60 * 60)
  };
  
  const payloadB64 = Buffer.from(JSON.stringify(payload))
    .toString('base64url');
  
  const hmac = crypto
    .createHmac('sha256', SECRET)
    .update(payloadB64)
    .digest('base64url');
  
  return `${payloadB64}.${hmac}`;
}

/**
 * Verify and decode a signed token
 * @param {string} token - Token to verify
 * @returns {Object} - Decoded payload or throws error
 */
export function verify(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token format');
  }
  
  const [payloadB64, hmacB64] = token.split('.');
  
  if (!payloadB64 || !hmacB64) {
    throw new Error('Invalid token structure');
  }
  
  // Verify HMAC
  const expectedHmac = crypto
    .createHmac('sha256', SECRET)
    .update(payloadB64)
    .digest('base64url');
  
  if (hmacB64 !== expectedHmac) {
    throw new Error('Invalid token signature');
  }
  
  // Decode payload
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  
  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  
  return payload;
}