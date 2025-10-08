import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Enhanced phone number validation and formatting using libphonenumber-js
 * Auto-corrects common formats instead of rejecting
 */

export interface PhoneValidationResult {
  valid: boolean;
  e164: string | null;
  country: string | null;
  nationalFormat: string | null;
  error?: string;
}

/**
 * Parse and validate phone number with auto-correction
 * @param phoneInput Raw phone number input
 * @param defaultCountry Default country code (e.g., 'US', 'CA')
 * @returns Validation result with E.164 format if valid
 */
export function validateAndFormatPhone(
  phoneInput: string,
  defaultCountry: CountryCode = 'US'
): PhoneValidationResult {
  if (!phoneInput || phoneInput.trim() === '') {
    return {
      valid: false,
      e164: null,
      country: null,
      nationalFormat: null,
      error: 'Phone number is required'
    };
  }

  const cleaned = phoneInput.trim();

  try {
    // Try parsing with provided country
    if (isValidPhoneNumber(cleaned, defaultCountry)) {
      const phoneNumber = parsePhoneNumber(cleaned, defaultCountry);
      return {
        valid: true,
        e164: phoneNumber.number,
        country: phoneNumber.country || null,
        nationalFormat: phoneNumber.formatNational()
      };
    }

    // Try parsing without country (handles international format)
    if (isValidPhoneNumber(cleaned)) {
      const phoneNumber = parsePhoneNumber(cleaned);
      return {
        valid: true,
        e164: phoneNumber.number,
        country: phoneNumber.country || null,
        nationalFormat: phoneNumber.formatNational()
      };
    }

    // If we get here, the number is invalid
    return {
      valid: false,
      e164: null,
      country: null,
      nationalFormat: null,
      error: `Invalid phone number format. Please use international format (e.g., +1-555-123-4567) or local format with country code.`
    };

  } catch (error) {
    return {
      valid: false,
      e164: null,
      country: null,
      nationalFormat: null,
      error: error instanceof Error ? error.message : 'Invalid phone number'
    };
  }
}

/**
 * Extract country code from phone number
 */
export function getPhoneCountry(phoneInput: string): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phoneInput);
    return phoneNumber.country || null;
  } catch {
    return null;
  }
}

/**
 * Format phone number for display (national format)
 */
export function formatPhoneForDisplay(e164: string): string {
  try {
    const phoneNumber = parsePhoneNumber(e164);
    return phoneNumber.formatNational();
  } catch {
    return e164;
  }
}

/**
 * Check if phone number is mobile (for SMS capability detection)
 */
export function isMobileNumber(e164: string): boolean {
  try {
    const phoneNumber = parsePhoneNumber(e164);
    return phoneNumber.getType() === 'MOBILE' || phoneNumber.getType() === 'FIXED_LINE_OR_MOBILE';
  } catch {
    return false;
  }
}
