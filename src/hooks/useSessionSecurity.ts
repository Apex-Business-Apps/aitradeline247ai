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

  // Check for concurrent sessions using analytics data
  const checkConcurrentSessions = useCallback(async () => {
    if (!user) return;

    try {
      // Use analytics events to detect concurrent sessions
      const { data } = await supabase
        .from('analytics_events')
        .select('session_id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        const uniqueSessions = new Set(data.map(event => event.session_id).filter(Boolean));
        if (uniqueSessions.size > 3) {
          console.warn('🚨 Multiple active sessions detected');
          // Log security event for monitoring
          supabase.functions.invoke('secure-analytics', {
            body: {
              event_type: 'concurrent_sessions_detected',
              event_data: {
                session_count: uniqueSessions.size,
                user_id: user.id
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to check concurrent sessions:', error);
    }
  }, [user]);

  // Monitor for critical suspicious activity only (removed invasive monitoring)
  const monitorSuspiciousActivity = useCallback(() => {
    // Only monitor truly suspicious events, not normal user actions
    const criticalEvents = ['contextmenu'];
    let eventCount = 0;
    const threshold = 10;

    const logSuspiciousActivity = (event: Event) => {
      eventCount++;
      
      // Only log if threshold exceeded (prevents false positives)
      if (eventCount > threshold) {
        console.warn(`🚨 Suspicious activity pattern detected: ${event.type}`);
        supabase.functions.invoke('secure-analytics', {
          body: {
            event_type: 'suspicious_activity_pattern',
            event_data: {
              activity_type: event.type,
              event_count: eventCount,
              timestamp: new Date().toISOString()
            }
          }
        });
        eventCount = 0; // Reset after logging
      }
    };

    criticalEvents.forEach(eventType => {
      document.addEventListener(eventType, logSuspiciousActivity);
    });

    return () => {
      criticalEvents.forEach(eventType => {
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