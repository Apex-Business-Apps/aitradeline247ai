/**
 * Comprehensive Input Sanitization Utility
 * Prevents XSS, injection, and other input-based attacks
 */

/**
 * Sanitize text input by removing dangerous characters and patterns
 */
export function sanitizeText(
  input: string | null | undefined,
  options: {
    maxLength?: number;
    allowedChars?: RegExp;
    stripHtml?: boolean;
    toLowerCase?: boolean;
  } = {}
): string {
  if (!input) return '';
  
  const {
    maxLength = 5000,
    allowedChars,
    stripHtml = true,
    toLowerCase = false
  } = options;
  
  let sanitized = input.trim().substring(0, maxLength);
  
  // Strip HTML tags if requested
  if (stripHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Remove dangerous characters
  sanitized = sanitized
    .replace(/[<>'"&`${}\\]/g, '') // Dangerous chars
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[\x00-\x1F\x7F]/g, ''); // Control characters
  
  // Apply allowed characters filter if provided
  if (allowedChars && !allowedChars.test(sanitized)) {
    throw new Error('Input contains invalid characters');
  }
  
  // Convert case if requested
  if (toLowerCase) {
    sanitized = sanitized.toLowerCase();
  }
  
  return sanitized;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) throw new Error('Email is required');
  
  const sanitized = sanitizeText(email, {
    maxLength: 255,
    toLowerCase: true,
    stripHtml: true
  });
  
  // Strict email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  // Block disposable email domains
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com',
    'guerrillamail.com', 'mailinator.com', 'maildrop.cc'
  ];
  
  const domain = sanitized.split('@')[1];
  if (disposableDomains.includes(domain)) {
    throw new Error('Disposable email addresses are not allowed');
  }
  
  return sanitized;
}

/**
 * Validate and sanitize phone number (E.164 format)
 * NOW AUTO-FORMATS instead of rejecting for better UX
 * 
 * NOTE: This is a simplified version for edge function compatibility.
 * For full international validation with libphonenumber-js, use:
 * import { validateAndFormatPhone } from './phoneValidator.ts'
 */
export function sanitizePhone(phone: string | null | undefined, defaultCountry: 'US' | 'CA' = 'US'): string | null {
  // Allow null/empty phone (optional field in most forms)
  if (!phone || phone.trim() === '') return null;
  
  // Remove all non-digit characters except leading +
  let sanitized = phone.trim().replace(/[^\d+]/g, '');
  
  // Handle empty after cleanup
  if (!sanitized) return null;
  
  // Auto-format to E.164: +[country code][number]
  if (!sanitized.startsWith('+')) {
    // Assume North American number if no country code
    if (sanitized.length === 10) {
      sanitized = '+1' + sanitized;  // (555) 123-4567 → +15551234567
    } else if (sanitized.length === 11 && sanitized.startsWith('1')) {
      sanitized = '+' + sanitized;   // 1-555-123-4567 → +15551234567
    } else if (sanitized.length === 7) {
      // Local format, needs area code - return as-is for manual review
      console.warn('Phone appears to be local format (7 digits), cannot auto-format');
      return null;
    } else {
      // International but missing +, try adding it
      sanitized = '+' + sanitized;
    }
  }
  
  // Validate E.164 format (allow slightly lenient for international)
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  if (!e164Regex.test(sanitized)) {
    console.warn(`Phone "${phone}" does not match E.164 after formatting: ${sanitized}`);
    return null;  // Return null instead of throwing error
  }
  
  return sanitized;
}

/**
 * Sanitize name input (allows letters, spaces, hyphens, apostrophes, periods)
 */
export function sanitizeName(name: string | null | undefined, maxLength = 100): string {
  if (!name) throw new Error('Name is required');
  
  const sanitized = sanitizeText(name, {
    maxLength,
    allowedChars: /^[a-zA-Z\s\-'\.]+$/,
    stripHtml: true
  });
  
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Name must contain at least 1 character');
  }
  
  return sanitized;
}

/**
 * Sanitize company name (allows alphanumeric, spaces, common punctuation)
 */
export function sanitizeCompanyName(company: string | null | undefined, maxLength = 200): string {
  if (!company) throw new Error('Company name is required');
  
  const sanitized = sanitizeText(company, {
    maxLength,
    allowedChars: /^[a-zA-Z0-9\s\-&.,()]+$/,
    stripHtml: true
  });
  
  if (!sanitized || sanitized.length < 1) {
    throw new Error('Company name must contain at least 1 character');
  }
  
  return sanitized;
}

/**
 * Detect and block SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|eval)\b)/gi,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
    /(\bor\b.*=.*\bor\b)/gi,
    /('|\").*(\bor\b|=).*('|\")/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive security validation
 */
export function validateSecurity(input: string, context = 'general'): void {
  if (detectSQLInjection(input)) {
    console.error(`🚨 SQL injection attempt detected in ${context}`);
    throw new Error('Suspicious content detected');
  }
  
  if (detectXSS(input)) {
    console.error(`🚨 XSS attempt detected in ${context}`);
    throw new Error('Suspicious content detected');
  }
}

/**
 * Sanitize JSON data recursively
 */
export function sanitizeJSON(
  data: any,
  maxDepth = 10,
  currentDepth = 0
): any {
  if (currentDepth > maxDepth) {
    throw new Error('Maximum JSON depth exceeded');
  }
  
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    return sanitizeText(data, { maxLength: 10000 });
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (Array.isArray(data)) {
    if (data.length > 1000) {
      throw new Error('Array too large (max 1000 elements)');
    }
    return data.map(item => sanitizeJSON(item, maxDepth, currentDepth + 1));
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    const keys = Object.keys(data);
    
    if (keys.length > 100) {
      throw new Error('Object has too many keys (max 100)');
    }
    
    for (const key of keys) {
      const sanitizedKey = sanitizeText(key, { maxLength: 100 });
      sanitized[sanitizedKey] = sanitizeJSON(data[key], maxDepth, currentDepth + 1);
    }
    
    return sanitized;
  }
  
  return data;
}
