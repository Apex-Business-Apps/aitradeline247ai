import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSessionSecurity = () => {
  const { user, session } = useAuth();

  // Track session activity
  const trackActivity = useCallback(async () => {
    if (!user || !session) return;

    try {
      await supabase.functions.invoke('track-session-activity', {
        body: {
          user_id: user.id,
          session_token: session.access_token,
          activity_timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track session activity:', error);
    }
  }, [user, session]);

  // Check for concurrent sessions (simplified without database)
  const checkConcurrentSessions = useCallback(async () => {
    if (!user) return;

    try {
      // TODO: Create user_sessions table when implementing session management
      // For now, just log that we would check for concurrent sessions
      console.log('Concurrent session check skipped - no user_sessions table');
    } catch (error) {
      console.error('Failed to check concurrent sessions:', error);
    }
  }, [user]);

  // Monitor for suspicious activity
  const monitorSuspiciousActivity = useCallback(() => {
    const suspiciousEvents = [
      'copy', 'cut', 'paste',
      'contextmenu', 'selectstart',
      'dragstart', 'drop'
    ];

    const logSuspiciousActivity = (event: Event) => {
      console.warn(`🚨 Suspicious activity detected: ${event.type}`);
      // Log to analytics for security monitoring
      supabase.functions.invoke('secure-analytics', {
        body: {
          event_type: 'suspicious_activity',
          event_data: {
            activity_type: event.type,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        }
      });
    };

    suspiciousEvents.forEach(eventType => {
      document.addEventListener(eventType, logSuspiciousActivity);
    });

    return () => {
      suspiciousEvents.forEach(eventType => {
        document.removeEventListener(eventType, logSuspiciousActivity);
      });
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Track initial session
    trackActivity();
    checkConcurrentSessions();

    // Set up activity tracking
    const activityInterval = setInterval(trackActivity, 5 * 60 * 1000); // Every 5 minutes
    const sessionInterval = setInterval(checkConcurrentSessions, 15 * 60 * 1000); // Every 15 minutes

    // Monitor suspicious activity
    const cleanupMonitoring = monitorSuspiciousActivity();

    return () => {
      clearInterval(activityInterval);
      clearInterval(sessionInterval);
      cleanupMonitoring();
    };
  }, [user, trackActivity, checkConcurrentSessions, monitorSuspiciousActivity]);

  return {
    trackActivity,
    checkConcurrentSessions
  };
};