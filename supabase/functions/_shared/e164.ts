/**
 * E.164 Phone Number Utilities
 * Ensures all phone numbers are stored and used in international E.164 format
 * 
 * E.164 Format: +[country code][subscriber number]
 * Example: +15877428885 (Canada/US)
 */

/**
 * Check if a string is in valid E.164 format
 * E.164 rules:
 * - Starts with +
 * - Followed by 1-3 digit country code
 * - Followed by up to 15 digits
 * - Total max 15 digits (excluding +)
 */
export function isValidE164(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // E.164 regex: +[1-3 digits country code][up to 15 total digits]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Normalize North American numbers to E.164
 * Handles common formats:
 * - (587) 742-8885 → +15877428885
 * - 587-742-8885 → +15877428885
 * - 5877428885 → +15877428885
 * - 1-587-742-8885 → +15877428885
 * - +1 (587) 742-8885 → +15877428885
 */
export function normalizeToE164(phone: string, defaultCountryCode: string = '1'): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Invalid phone number input');
  }

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If already in E.164 format, validate and return
  if (cleaned.startsWith('+')) {
    if (isValidE164(cleaned)) {
      return cleaned;
    }
    throw new Error(`Invalid E.164 format: ${phone}`);
  }

  // Handle North American numbers (10 or 11 digits)
  if (cleaned.length === 10) {
    // 10 digits: assume NANP, add +1
    return `+${defaultCountryCode}${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // 11 digits starting with 1: NANP format
    return `+${cleaned}`;
  } else if (cleaned.length === 11 && !cleaned.startsWith('1')) {
    // 11 digits not starting with 1: assume country code
    return `+${cleaned}`;
  }

  // Try adding default country code
  const attempt = `+${defaultCountryCode}${cleaned}`;
  if (isValidE164(attempt)) {
    return attempt;
  }

  throw new Error(`Cannot normalize to E.164: ${phone}`);
}

/**
 * Extract country code from E.164 number
 * +15877428885 → 1
 * +442071234567 → 44
 */
export function extractCountryCode(e164: string): string {
  if (!isValidE164(e164)) {
    throw new Error(`Invalid E.164 number: ${e164}`);
  }

  // Remove + and extract first 1-3 digits as country code
  const digits = e164.substring(1);
  
  // Try 1 digit (e.g., 1 for NANP)
  if (digits[0] === '1' && digits.length >= 11) {
    return '1';
  }
  
  // Try 2 digits (e.g., 44 for UK)
  if (digits.length >= 2) {
    const twoDigit = digits.substring(0, 2);
    if (['20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98'].includes(twoDigit)) {
      return twoDigit;
    }
  }
  
  // Try 3 digits (e.g., 234 for Nigeria)
  if (digits.length >= 3) {
    return digits.substring(0, 3);
  }

  return digits[0]; // Fallback to first digit
}

/**
 * Format E.164 for display
 * +15877428885 → +1 (587) 742-8885
 */
export function formatE164ForDisplay(e164: string): string {
  if (!isValidE164(e164)) {
    return e164; // Return as-is if invalid
  }

  const countryCode = extractCountryCode(e164);
  const subscriber = e164.substring(1 + countryCode.length);

  // Format NANP numbers
  if (countryCode === '1' && subscriber.length === 10) {
    const area = subscriber.substring(0, 3);
    const exchange = subscriber.substring(3, 6);
    const line = subscriber.substring(6, 10);
    return `+1 (${area}) ${exchange}-${line}`;
  }

  // Format UK numbers
  if (countryCode === '44' && subscriber.length === 10) {
    const area = subscriber.substring(0, 2);
    const local = subscriber.substring(2);
    return `+44 ${area} ${local}`;
  }

  // Default: +[country] [subscriber]
  return `+${countryCode} ${subscriber}`;
}

/**
 * Validate and normalize a batch of phone numbers
 */
export function normalizeBatch(phones: string[], defaultCountryCode: string = '1'): {
  valid: string[];
  invalid: { input: string; error: string }[];
} {
  const valid: string[] = [];
  const invalid: { input: string; error: string }[] = [];

  for (const phone of phones) {
    try {
      const normalized = normalizeToE164(phone, defaultCountryCode);
      valid.push(normalized);
    } catch (error) {
      invalid.push({
        input: phone,
        error: error.message
      });
    }
  }

  return { valid, invalid };
}

/**
 * Mask E.164 number for PII protection
 * +15877428885 → +1587***8885
 */
export function maskE164(e164: string): string {
  if (!isValidE164(e164)) {
    return '***';
  }

  const countryCode = extractCountryCode(e164);
  const subscriber = e164.substring(1 + countryCode.length);

  if (subscriber.length >= 8) {
    const first = subscriber.substring(0, 3);
    const last = subscriber.substring(subscriber.length - 4);
    return `+${countryCode}${first}***${last}`;
  }

  return `+${countryCode}***`;
}

