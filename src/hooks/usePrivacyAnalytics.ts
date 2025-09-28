import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PrivacyAnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  page_url?: string;
  anonymize_immediately?: boolean;
}

export const usePrivacyAnalytics = () => {
  // Privacy-first session ID generation
  const getPrivacySessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('tl247_privacy_session');
    if (!sessionId) {
      // Generate anonymous session ID with no personal identifiers
      const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp for privacy
      const randomComponent = Math.random().toString(36).substr(2, 12);
      sessionId = `anon_${timestamp}_${randomComponent}`;
      sessionStorage.setItem('tl247_privacy_session', sessionId);
      
      // Auto-expire session ID after 24 hours for privacy
      setTimeout(() => {
        sessionStorage.removeItem('tl247_privacy_session');
      }, 24 * 60 * 60 * 1000);
    }
    return sessionId;
  }, []);

  // Privacy-focused analytics tracking with automatic data minimization
  const trackPrivacyEvent = useCallback(async (event: PrivacyAnalyticsEvent) => {
    try {
      // Client-side rate limiting to prevent excessive calls
      const lastEventKey = `last_privacy_event_${event.event_type}`;
      const lastEventTime = sessionStorage.getItem(lastEventKey);
      const now = Date.now();
      
      // Skip if same event type was sent in last 2 seconds
      if (lastEventTime && (now - parseInt(lastEventTime)) < 2000) {
        return;
      }
      sessionStorage.setItem(lastEventKey, now.toString());

      const sessionId = getPrivacySessionId();
      
      // Sanitize and minimize data collection
      const sanitizedEventData = {
        ...event.event_data,
        // Remove any potentially sensitive fields
        password: undefined,
        email: undefined,
        phone: undefined,
        // Truncate long text fields for privacy
        ...(event.event_data?.message && {
          message: event.event_data.message.substring(0, 100) + '...'
        })
      };

      // Use secure analytics function with privacy enhancements
      const { error } = await supabase.functions.invoke('secure-analytics', {
        body: {
          event_type: event.event_type,
          event_data: sanitizedEventData,
          user_session: sessionId,
          page_url: event.page_url || window.location.pathname, // Only pathname for privacy
          privacy_mode: true,
          anonymize_immediately: event.anonymize_immediately || false
        }
      });

      if (error) {
        // Only log once to prevent recursion
        if (!sessionStorage.getItem('analytics_error_logged')) {
          console.error('Privacy analytics tracking error:', error);
          sessionStorage.setItem('analytics_error_logged', 'true');
          setTimeout(() => sessionStorage.removeItem('analytics_error_logged'), 30000);
        }
      }
    } catch (error) {
      // Only log once to prevent console spam
      if (!sessionStorage.getItem('analytics_error_logged')) {
        console.error('Privacy analytics tracking failed:', error);
        sessionStorage.setItem('analytics_error_logged', 'true');
        setTimeout(() => sessionStorage.removeItem('analytics_error_logged'), 30000);
      }
    }
  }, [getPrivacySessionId]);

  // GDPR-compliant page view tracking
  const trackPrivacyPageView = useCallback((page: string) => {
    trackPrivacyEvent({
      event_type: 'page_view',
      event_data: { 
        page: page.replace(/[0-9]/g, 'X'), // Anonymize IDs in URLs
        referrer: document.referrer ? 'external' : 'direct' // Minimal referrer data
      }
    });
  }, [trackPrivacyEvent]);

  // Privacy-focused interaction tracking
  const trackPrivacyInteraction = useCallback((interaction_type: string, element?: string) => {
    trackPrivacyEvent({
      event_type: 'user_interaction',
      event_data: { 
        interaction_type,
        element: element?.substring(0, 50), // Limit element data
        timestamp_rounded: Math.floor(Date.now() / 60000) * 60000 // Round to minute for privacy
      },
      anonymize_immediately: true // Flag for immediate anonymization
    });
  }, [trackPrivacyEvent]);

  // Enhanced form submission tracking with privacy controls
  const trackPrivacyFormSubmission = useCallback((form_name: string, success: boolean, metadata?: any) => {
    const sanitizedMetadata = {
      ...metadata,
      // Remove any form data, keep only technical success metrics
      form_data: undefined,
      user_input: undefined,
      validation_errors: metadata?.validation_errors ? 'has_errors' : 'no_errors'
    };

    trackPrivacyEvent({
      event_type: 'form_submission',
      event_data: { 
        form_name, 
        success,
        ...sanitizedMetadata
      },
      anonymize_immediately: true
    });
  }, [trackPrivacyEvent]);

  // Conversion tracking with enhanced privacy
  const trackPrivacyConversion = useCallback((conversion_type: string, metadata?: any) => {
    trackPrivacyEvent({
      event_type: 'conversion',
      event_data: { 
        conversion_type,
        // Only keep non-PII metadata
        source: metadata?.source || 'unknown',
        funnel_step: metadata?.funnel_step || 'unknown'
      },
      anonymize_immediately: false // Keep conversion data longer for business analytics
    });
  }, [trackPrivacyEvent]);

  // Error tracking with privacy focus
  const trackPrivacyError = useCallback((error_type: string, error_message: string, context?: any) => {
    // Sanitize error messages to remove any potential PII
    const sanitizedMessage = error_message
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Remove emails
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]') // Remove phone numbers
      .substring(0, 200); // Limit message length

    trackPrivacyEvent({
      event_type: 'error',
      event_data: { 
        error_type, 
        error_message: sanitizedMessage,
        context: context ? 'has_context' : 'no_context' // Don't log actual context
      },
      anonymize_immediately: true
    });
  }, [trackPrivacyEvent]);

  // Automatic cleanup of client-side privacy data
  useEffect(() => {
    const cleanup = () => {
      // Clean up old privacy session data on page unload
      const sessionId = sessionStorage.getItem('tl247_privacy_session');
      if (sessionId) {
        const [, timestamp] = sessionId.split('_');
        const sessionAge = Date.now() - (parseInt(timestamp) * 1000);
        
        // Remove session if older than 24 hours
        if (sessionAge > 24 * 60 * 60 * 1000) {
          sessionStorage.removeItem('tl247_privacy_session');
        }
      }
    };

    window.addEventListener('beforeunload', cleanup);
    
    // Periodic cleanup every hour
    const cleanupInterval = setInterval(cleanup, 60 * 60 * 1000);

    return () => {
      window.removeEventListener('beforeunload', cleanup);
      clearInterval(cleanupInterval);
    };
  }, []);

  return {
    trackPrivacyEvent,
    trackPrivacyPageView,
    trackPrivacyInteraction,
    trackPrivacyFormSubmission,
    trackPrivacyConversion,
    trackPrivacyError,
    getPrivacySessionId
  };
};
