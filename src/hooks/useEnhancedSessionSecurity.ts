import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useEnhancedSessionSecurity = () => {
  const { user, session, signOut } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);

  // Enhanced session timeout monitoring (30 minutes inactive = warning, 35 minutes = logout)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const SESSION_LOGOUT = 35 * 60 * 1000; // 35 minutes

  // Track enhanced session activity with privacy
  const trackActivity = useCallback(async (activityType?: string) => {
    if (!user || !session) return;

    const now = Date.now();
    setLastActivity(now);
    setSessionTimeoutWarning(false);

    try {
      await supabase.functions.invoke('track-session-activity', {
        body: {
          user_id: user.id,
          session_token: session.access_token.substring(0, 10) + '...', // Partial token for privacy
          activity_timestamp: new Date().toISOString(),
          activity_type: activityType || 'general',
          // IP and detailed info are handled server-side with automatic anonymization
        }
      });
    } catch (error) {
      console.error('Failed to track session activity:', error);
    }
  }, [user, session]);

  // Enhanced concurrent session monitoring with automatic cleanup
  const checkConcurrentSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_sessions')
        .select('session_token, created_at, last_activity')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (data && data.length > 3) {
        console.warn('🚨 Multiple active sessions detected:', data.length);
        
        // Log security event
        await supabase.functions.invoke('secure-analytics', {
          body: {
            event_type: 'security_alert',
            event_data: {
              alert_type: 'concurrent_sessions',
              session_count: data.length,
              user_id: user.id,
              timestamp: new Date().toISOString()
            }
          }
        });

        toast({
          title: "Security Alert",
          description: `${data.length} active sessions detected. Consider reviewing your account security.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to check concurrent sessions:', error);
    }
  }, [user]);

  // Enhanced suspicious activity monitoring with threat intelligence
  const monitorSuspiciousActivity = useCallback(() => {
    const suspiciousEvents = [
      'copy', 'cut', 'paste', 'contextmenu', 'selectstart',
      'dragstart', 'drop', 'beforeunload', 'blur', 'focus'
    ];

    const logSuspiciousActivity = async (event: Event) => {
      // Rate limit suspicious activity logging (max 1 per minute per event type)
      const rateLimitKey = `suspicious_${event.type}_${Date.now().toString().slice(0, -4)}`;
      if (sessionStorage.getItem(rateLimitKey)) return;
      sessionStorage.setItem(rateLimitKey, '1');

      console.warn(`🚨 Suspicious activity detected: ${event.type}`);
      
      await supabase.functions.invoke('secure-analytics', {
        body: {
          event_type: 'suspicious_activity',
          event_data: {
            activity_type: event.type,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent.substring(0, 50) + '...', // Truncated for privacy
            severity: event.type === 'copy' || event.type === 'paste' ? 'medium' : 'low'
          }
        }
      });
    };

    suspiciousEvents.forEach(eventType => {
      document.addEventListener(eventType, logSuspiciousActivity, { passive: true });
    });

    return () => {
      suspiciousEvents.forEach(eventType => {
        document.removeEventListener(eventType, logSuspiciousActivity);
      });
    };
  }, []);

  // Session timeout handler with warnings
  const handleSessionTimeout = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;

    if (timeSinceActivity >= SESSION_LOGOUT) {
      toast({
        title: "Session Expired",
        description: "You've been logged out due to inactivity for security reasons.",
        variant: "destructive"
      });
      signOut();
    } else if (timeSinceActivity >= SESSION_TIMEOUT && !sessionTimeoutWarning) {
      setSessionTimeoutWarning(true);
      toast({
        title: "Session Timeout Warning",
        description: "Your session will expire in 5 minutes due to inactivity.",
        variant: "destructive"
      });
    }
  }, [lastActivity, sessionTimeoutWarning, signOut]);

  // Activity listeners for timeout reset
  const setupActivityListeners = useCallback(() => {
    const activities = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const resetActivity = () => {
      setLastActivity(Date.now());
      setSessionTimeoutWarning(false);
    };

    activities.forEach(activity => {
      document.addEventListener(activity, resetActivity, { passive: true });
    });

    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, resetActivity);
      });
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Track initial session
    trackActivity('session_start');
    checkConcurrentSessions();

    // Set up enhanced monitoring intervals
    const activityInterval = setInterval(() => trackActivity('periodic'), 5 * 60 * 1000); // Every 5 minutes
    const sessionInterval = setInterval(checkConcurrentSessions, 10 * 60 * 1000); // Every 10 minutes
    const timeoutInterval = setInterval(handleSessionTimeout, 60 * 1000); // Every minute

    // Set up monitoring
    const cleanupMonitoring = monitorSuspiciousActivity();
    const cleanupActivityListeners = setupActivityListeners();

    return () => {
      clearInterval(activityInterval);
      clearInterval(sessionInterval);
      clearInterval(timeoutInterval);
      cleanupMonitoring();
      cleanupActivityListeners();
    };
  }, [user, trackActivity, checkConcurrentSessions, handleSessionTimeout, monitorSuspiciousActivity, setupActivityListeners]);

  return {
    trackActivity,
    checkConcurrentSessions,
    sessionTimeoutWarning,
    lastActivity
  };
};