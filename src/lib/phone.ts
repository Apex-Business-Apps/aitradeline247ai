/**
 * Client-side phone number validation and normalization
 */

/**
 * Check if phone number is North American Numbering Plan (NANP)
 * @param e164 - Phone number in E.164 format
 * @returns boolean
 */
export function isNANP(e164: string): boolean {
  return /^\+1\d{10}$/.test(e164);
}

/**
 * Normalize phone input to E.164 format
 * @param input - Raw phone input
 * @returns E.164 formatted number
 */
export function normalize(input: string): string {
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

/**
 * Format phone number for display
 * @param e164 - Phone number in E.164 format
 * @returns Formatted phone number
 */
export function formatForDisplay(e164: string): string {
  if (!e164 || !isNANP(e164)) return e164;
  
  const digits = e164.slice(2); // Remove +1
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Validate phone number input
 * @param input - Phone number input
 * @returns Validation result
 */
export function validatePhone(input: string): { valid: boolean; error?: string } {
  if (!input) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const normalized = normalize(input);
  
  if (!isNANP(normalized)) {
    return { 
      valid: false, 
      error: 'Please enter a valid US/Canada phone number (10 digits)' 
    };
  }
  
  return { valid: true };
}