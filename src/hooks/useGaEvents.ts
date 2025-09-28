import { useEffect } from 'react';
import { ga } from '@/lib/ga';

/**
 * Hook for GA4 event tracking related to email CTAs and deposits
 */
export function useGaEvents() {
  
  /**
   * Track missed call email sent (fires once on mount if window.__missedSent=1)
   */
  const useEmailMissedSent = () => {
    useEffect(() => {
      if (typeof window !== 'undefined' && window.__missedSent === 1) {
        ga('email_missed_sent', {
          event_category: 'email',
          event_label: 'missed_call_notification'
        });
        // Clear flag to prevent duplicate tracking
        window.__missedSent = 0;
      }
    }, []);
  };

  /**
   * Track callback CTA click from email
   * @param e164 - Phone number that will be called back
   */
  const onCallbackCtaClick = (e164: string) => {
    ga('cta_callback_click', {
      e164,
      event_category: 'email_cta',
      event_label: 'callback_requested'
    });
  };

  /**
   * Track deposit CTA click from email
   * @param e164 - Phone number associated with deposit
   * @param amount - Deposit amount
   */
  const onDepositCtaClick = (e164: string, amount: number) => {
    ga('cta_deposit_click', {
      e164,
      value: amount,
      currency: 'CAD',
      event_category: 'email_cta',
      event_label: 'deposit_initiated'
    });
  };

  /**
   * Track successful Stripe deposit
   * @param e164 - Phone number associated with deposit
   * @param amount - Deposit amount
   */
  const onStripeDepositSuccess = (e164: string, amount: number) => {
    ga('stripe_deposit_success', {
      e164,
      value: amount,
      currency: 'CAD',
      event_category: 'conversion',
      event_label: 'deposit_completed'
    });
  };

  /**
   * Track email CTA resolve action
   * @param e164 - Phone number marked as resolved
   */
  const onResolveCtaClick = (e164: string) => {
    ga('cta_resolve_click', {
      e164,
      event_category: 'email_cta',
      event_label: 'call_resolved'
    });
  };

  /**
   * Track successful callback initiation
   * @param e164 - Phone number being called back
   */
  const onCallbackSuccess = (e164: string) => {
    ga('callback_initiated', {
      e164,
      event_category: 'conversion',
      event_label: 'callback_started'
    });
  };

  return {
    useEmailMissedSent,
    onCallbackCtaClick,
    onDepositCtaClick,
    onStripeDepositSuccess,
    onResolveCtaClick,
    onCallbackSuccess
  };
}

/**
 * Direct export of individual hooks for convenience
 */
export const useEmailMissedSent = () => {
  const { useEmailMissedSent } = useGaEvents();
  return useEmailMissedSent();
};

export const onCallbackCtaClick = (e164: string) => {
  const { onCallbackCtaClick } = useGaEvents();
  return onCallbackCtaClick(e164);
};

export const onDepositCtaClick = (e164: string, amount: number) => {
  const { onDepositCtaClick } = useGaEvents();
  return onDepositCtaClick(e164, amount);
};

export const onStripeDepositSuccess = (e164: string, amount: number) => {
  const { onStripeDepositSuccess } = useGaEvents();
  return onStripeDepositSuccess(e164, amount);
};

export const onResolveCtaClick = (e164: string) => {
  const { onResolveCtaClick } = useGaEvents();
  return onResolveCtaClick(e164);
};

export const onCallbackSuccess = (e164: string) => {
  const { onCallbackSuccess } = useGaEvents();
  return onCallbackSuccess(e164);
};