/**
 * Google Analytics 4 event tracking utilities
 */

/**
 * Send a GA4 event
 * @param event - Event name
 * @param params - Event parameters
 */
export function ga(event: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params || {});
  } else {
    console.warn('GA4 not loaded, event not sent:', event, params);
  }
}

/**
 * Track page view
 * @param page_title - Page title
 * @param page_location - Page URL
 */
export function gaPageView(page_title: string, page_location?: string) {
  ga('page_view', {
    page_title,
    page_location: page_location || window.location.href
  });
}

/**
 * Track conversion event
 * @param currency - Currency code (e.g., 'CAD')
 * @param value - Conversion value
 * @param transaction_id - Unique transaction ID
 */
export function gaConversion(currency: string, value: number, transaction_id?: string) {
  ga('purchase', {
    currency,
    value,
    transaction_id
  });
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    __missedSent?: number;
  }
}