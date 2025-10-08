/**
 * Dynamic Disposable Email Checker
 * Uses a more comprehensive blocklist with easy updates
 */

// Comprehensive disposable email domain list (updated 2025)
const DISPOSABLE_DOMAINS = new Set([
  // Common disposable services
  'tempmail.com', 'throwaway.email', '10minutemail.com',
  'guerrillamail.com', 'mailinator.com', 'maildrop.cc',
  'trashmail.com', 'temp-mail.org', 'getnada.com',
  'sharklasers.com', 'guerrillamail.info', 'grr.la',
  'guerrillamail.biz', 'guerrillamail.de', 'spam4.me',
  'yopmail.com', 'mytemp.email', 'fake-mail.com',
  'dispostable.com', 'emailondeck.com', 'fakeinbox.com',
  
  // Additional known services
  'mailnesia.com', 'mailcatch.com', 'mohmal.com',
  'getairmail.com', 'mailinator2.com', 'zippymail.info',
  'mintemail.com', 'tmpeml.info', 'spamgourmet.com',
  'mailnator.com', 'trash-mail.com', '10minutemail.net'
]);

/**
 * Check if email domain is disposable
 * @param email - Email address to check
 * @returns true if email is disposable
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) {
    return false;
  }
  
  const domain = email.split('@')[1].toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Add domain to blocklist (runtime update)
 */
export function addDisposableDomain(domain: string): void {
  DISPOSABLE_DOMAINS.add(domain.toLowerCase());
}

/**
 * Get all disposable domains (for admin review)
 */
export function getDisposableDomains(): string[] {
  return Array.from(DISPOSABLE_DOMAINS).sort();
}

/**
 * Check email and throw error if disposable
 * Use this in edge functions for validation
 */
export function validateNotDisposable(email: string): void {
  if (isDisposableEmail(email)) {
    const domain = email.split('@')[1];
    throw new Error(
      `Disposable email addresses are not allowed. Domain "${domain}" is blocked.`
    );
  }
}
