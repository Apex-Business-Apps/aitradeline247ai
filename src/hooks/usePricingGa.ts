/**
 * Google Analytics hooks for pricing page events
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Track pricing page view
 */
export function onPricingView(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_pricing', {
      event_category: 'ecommerce',
      event_label: 'pricing_page'
    });
  }
}

/**
 * Track checkout start
 * @param plan - Selected plan name
 */
export function onCheckoutStart(plan: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      event_category: 'ecommerce',
      event_label: plan,
      plan: plan,
      value: getPlanValue(plan),
      currency: 'CAD'
    });
  }
}

/**
 * Track successful checkout
 * @param plan - Selected plan name
 */
export function onCheckoutSuccess(plan: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      event_category: 'ecommerce',
      event_label: plan,
      plan: plan,
      value: getPlanValue(plan),
      currency: 'CAD',
      transaction_id: `sub_${Date.now()}`
    });
  }
}

/**
 * Get plan value for analytics
 * @param plan - Plan name
 * @returns Plan value in CAD
 */
function getPlanValue(plan: string): number {
  const values: Record<string, number> = {
    basic: 149,
    pro: 299,
    enterprise: 599
  };
  
  return values[plan.toLowerCase()] || 149;
}