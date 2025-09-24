import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  page_url?: string;
}

export const useAnalytics = () => {
  // Generate or get session ID
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('tl247_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tl247_session', sessionId);
    }
    return sessionId;
  }, []);

  // Track analytics event
  const track = useCallback(async (event: AnalyticsEvent) => {
    try {
      const sessionId = getSessionId();
      // Limit user agent data to reduce fingerprinting potential
      const limitedUserAgent = navigator.userAgent.substring(0, 200);
      const pageUrl = event.page_url || window.location.href;

      const { error } = await supabase.from('analytics_events').insert({
        event_type: event.event_type,
        event_data: event.event_data || {},
        user_session: sessionId,
        page_url: pageUrl,
        user_agent: limitedUserAgent,
        // IP anonymization is handled by the backend/edge functions
      });

      if (error) {
        console.error('Analytics tracking error:', error);
      } else {
        console.log('Analytics event tracked:', event.event_type);
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }, [getSessionId]);

  // Common tracking functions
  const trackPageView = useCallback((page: string) => {
    track({
      event_type: 'page_view',
      event_data: { page }
    });
  }, [track]);

  const trackButtonClick = useCallback((button_id: string, location?: string) => {
    track({
      event_type: 'button_click',
      event_data: { button_id, location }
    });
  }, [track]);

  const trackFormSubmission = useCallback((form_name: string, success: boolean, data?: any) => {
    track({
      event_type: 'form_submission',
      event_data: { form_name, success, ...data }
    });
  }, [track]);

  const trackConversion = useCallback((conversion_type: string, value?: number, data?: any) => {
    track({
      event_type: 'conversion',
      event_data: { conversion_type, value, ...data }
    });
  }, [track]);

  const trackError = useCallback((error_type: string, error_message: string, context?: any) => {
    track({
      event_type: 'error',
      event_data: { error_type, error_message, context }
    });
  }, [track]);

  return {
    track,
    trackPageView,
    trackButtonClick,
    trackFormSubmission,
    trackConversion,
    trackError,
    getSessionId
  };
};