/**
 * Security utility functions for production-safe logging and data handling
 */

// PII patterns to redact from logs
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
  /\b\d{3}-\d{3}-\d{4}\b/g, // phone numbers
  /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // credit cards
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
];

/**
 * Sanitize data for production logging by removing PII
 */
export function sanitizeForLogging(data: any): any {
  if (import.meta.env.PROD) {
    const stringified = JSON.stringify(data);
    let sanitized = stringified;
    
    PII_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    try {
      return JSON.parse(sanitized);
    } catch {
      return '[SANITIZED_DATA]';
    }
  }
  return data;
}

/**
 * Production-safe console logging
 */
export const secureLog = {
  error: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.error(message, data);
    } else {
      console.error(message, sanitizeForLogging(data));
    }
  },
  warn: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.warn(message, data);
    } else {
      console.warn(message, sanitizeForLogging(data));
    }
  },
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.info(message, data);
    } else {
      console.info(message, sanitizeForLogging(data));
    }
  }
};

/**
 * Rate limiting utility for client-side protection
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return true;
    }
    
    // Update attempts
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    return false;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}