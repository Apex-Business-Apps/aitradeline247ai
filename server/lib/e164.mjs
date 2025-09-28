/**
 * Check if phone number is North American Numbering Plan (NANP)
 * @param {string} e164 - Phone number in E.164 format
 * @returns {boolean}
 */
export function isNANP(e164) {
  return /^\+1\d{10}$/.test(e164);
}

/**
 * Normalize phone input to E.164 format
 * @param {string} input - Raw phone input
 * @returns {string} - E.164 formatted number
 */
export function normalize(input) {
  if (!input) return '';
  
  // Strip all non-digits
  const digits = input.replace(/\D/g, '');
  
  // If starts with 1, prepend +
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  }
  
  // If 10 digits, assume US/Canada and prepend +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Return as-is with + if not already present
  return digits.startsWith('+') ? input : `+${digits}`;
}