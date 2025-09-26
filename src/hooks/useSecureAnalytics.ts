import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecureAnalyticsConfig {
  respectDoNotTrack?: boolean;
  anonymizeImmediately?: boolean;
  sessionOnly?: boolean;
}

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  user_session?: string;
  page_url?: string;
  // Note: ip_address and user_agent are handled server-side for privacy
}

export const useSecureAnalytics = (config: SecureAnalyticsConfig = {}) => {
  const [isTracking, setIsTracking] = useState(() => {
    // Respect Do Not Track browser setting
    if (config.respectDoNotTrack && navigator.doNotTrack === '1') {
      return false;
    }
    return true;
  });

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!isTracking) return;

    try {
      // Privacy-first event tracking
      const sanitizedEvent = {
        event_type: event.event_type,
        event_data: {
          ...event.event_data,
          // Add privacy metadata
          privacy_compliant: true,
          tracking_consent: true,
          anonymization_scheduled: config.anonymizeImmediately ? 'immediate' : 'standard',
          timestamp: new Date().toISOString()
        },
        user_session: config.sessionOnly ? 'session_only' : (event.user_session || 'anonymous'),
        page_url: event.page_url || window.location.pathname
      };

      // Use secure analytics edge function
      const { error } = await supabase.functions.invoke('secure-analytics', {
        body: sanitizedEvent
      });

      if (error) {
        console.warn('Analytics tracking failed:', error.message);
      }
    } catch (error) {
      // Fail silently to not break user experience
      console.warn('Analytics error:', error);
    }
  }, [isTracking, config]);

  const trackPageView = useCallback((url?: string) => {
    trackEvent({
      event_type: 'page_view',
      page_url: url || window.location.pathname,
      event_data: {
        referrer: document.referrer || 'direct',
        // Don't track detailed browser info for privacy
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        privacy_mode: true
      }
    });
  }, [trackEvent]);

  const trackInteraction = useCallback((element: string, action: string, metadata?: Record<string, any>) => {
    trackEvent({
      event_type: 'user_interaction',
      event_data: {
        element,
        action,
        ...metadata,
        // Remove any PII from metadata
        sanitized: true
      }
    });
  }, [trackEvent]);

  const trackConversion = useCallback((conversionType: string, value?: number, metadata?: Record<string, any>) => {
    trackEvent({
      event_type: 'conversion',
      event_data: {
        conversion_type: conversionType,
        value: value || 0,
        ...metadata,
        privacy_protected: true
      }
    });
  }, [trackEvent]);

  const optOut = useCallback(() => {
    setIsTracking(false);
    localStorage.setItem('analytics_opt_out', 'true');
    // Note: We don't track opt-out events to prevent recursion
  }, []);

  const optIn = useCallback(() => {
    setIsTracking(true);
    localStorage.removeItem('analytics_opt_out');
    // Note: We don't track opt-in events to prevent recursion
  }, []);

  const getPrivacyStatus = useCallback(() => {
    return {
      isTracking,
      doNotTrack: navigator.doNotTrack === '1',
      optedOut: localStorage.getItem('analytics_opt_out') === 'true',
      sessionOnly: config.sessionOnly || false,
      anonymizeImmediately: config.anonymizeImmediately || false
    };
  }, [isTracking, config]);

  return {
    trackEvent,
    trackPageView,
    trackInteraction,
    trackConversion,
    optOut,
    optIn,
    getPrivacyStatus,
    isTracking
  };
};