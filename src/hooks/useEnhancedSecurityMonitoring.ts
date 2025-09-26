import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SecurityEvent {
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
}

export const useEnhancedSecurityMonitoring = () => {
  const { user, session } = useAuth();
  const [securityAlerts, setSecurityAlerts] = useState<SecurityEvent[]>([]);
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);

  // Enhanced session token creation (simplified without database functions)
  const createSecureSession = useCallback(async (deviceFingerprint?: string) => {
    if (!user || !session) return null;

    try {
      // TODO: Create database functions when implementing enhanced security
      // For now, just return a simple session identifier
      return `session_${user.id}_${Date.now()}`;
    } catch (error) {
      console.error('Secure session creation error:', error);
      return null;
    }
  }, [user, session]);

  // Enhanced security event logging (simplified without database functions)
  const logSecurityEvent = useCallback(async (
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    details?: Record<string, any>
  ) => {
    try {
      // TODO: Create database functions when implementing security logging
      // For now, just log to console
      console.log(`Security Event: ${eventType} (${severity})`, details);

      // Add to local alerts for immediate user feedback
      const newAlert: SecurityEvent = { event_type: eventType, severity, details };
      setSecurityAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep only 5 most recent

      // Clear alert after delay based on severity
      const clearDelay = severity === 'critical' ? 30000 : severity === 'high' ? 15000 : 5000;
      setTimeout(() => {
        setSecurityAlerts(prev => prev.filter(alert => alert !== newAlert));
      }, clearDelay);

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user]);

  // Enhanced suspicious activity detection
  const monitorSuspiciousActivity = useCallback(() => {
    const suspiciousEvents = [
      'copy', 'cut', 'paste',
      'contextmenu', 'selectstart',
      'dragstart', 'drop',
      'keydown' // Monitor for suspicious key combinations
    ];

    const logSuspiciousActivity = (event: Event) => {
      const eventType = event.type;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      // Escalate severity for certain events
      if (eventType === 'paste' && (event.target as HTMLElement)?.tagName === 'INPUT') {
        severity = 'medium';
      }
      if (eventType === 'keydown') {
        const keyEvent = event as KeyboardEvent;
        // Detect potentially malicious key combinations
        if ((keyEvent.ctrlKey || keyEvent.metaKey) && ['j', 'u', 'i'].includes(keyEvent.key)) {
          severity = 'high';
        }
      }

      logSecurityEvent(`suspicious_${eventType}`, severity, {
        element_tag: (event.target as HTMLElement)?.tagName,
        timestamp: new Date().toISOString(),
        user_agent_partial: navigator.userAgent.substring(0, 100)
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
  }, [logSecurityEvent]);

  // Enhanced session timeout monitoring
  const monitorSessionTimeout = useCallback(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      const expiresAt = session.expires_at;
      if (!expiresAt) return;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      // Show warning 5 minutes before expiry
      if (timeUntilExpiry <= 300 && timeUntilExpiry > 0) {
        setSessionTimeoutWarning(true);
        logSecurityEvent('session_timeout_warning', 'medium', {
          expires_in_seconds: timeUntilExpiry
        });
      } else if (timeUntilExpiry <= 0) {
        logSecurityEvent('session_expired', 'high');
        // Force logout
        supabase.auth.signOut();
      } else {
        setSessionTimeoutWarning(false);
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60000);
    checkSessionExpiry(); // Initial check

    return () => clearInterval(interval);
  }, [session, logSecurityEvent]);

  // Device fingerprinting for enhanced session security
  const generateDeviceFingerprint = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    return {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas_hash: canvas.toDataURL().slice(-50), // Last 50 chars for privacy
      cookie_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack
    };
  }, []);

  // Enhanced browser security checks
  const performSecurityChecks = useCallback(async () => {
    const checks = [];

    // Check for HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      checks.push({ type: 'insecure_connection', severity: 'high' as const });
    }

    // Check for suspicious browser modifications (using safer detection)
    const hasExtensions = !!(window as any).chrome && 
                         !!(window as any).chrome.runtime && 
                         !!(window as any).chrome.runtime.onMessage;
    if (hasExtensions) {
      checks.push({ type: 'browser_extension_detected', severity: 'medium' as const });
    }

    // Check for console access (development tools)
    const threshold = 160;
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      checks.push({ type: 'developer_tools_open', severity: 'low' as const });
    }

    // Log all findings
    for (const check of checks) {
      await logSecurityEvent(check.type, check.severity);
    }

    return checks;
  }, [logSecurityEvent]);

  // Main security monitoring setup
  useEffect(() => {
    if (!user) return;

    // Initialize secure session
    const deviceFingerprint = JSON.stringify(generateDeviceFingerprint());
    createSecureSession(deviceFingerprint);

    // Set up monitoring
    const cleanupSuspiciousActivity = monitorSuspiciousActivity();
    const cleanupSessionTimeout = monitorSessionTimeout();

    // Perform initial security checks
    performSecurityChecks();

    // Log security monitoring activation
    logSecurityEvent('security_monitoring_activated', 'low', {
      user_id: user.id,
      session_id: session?.access_token?.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

    return () => {
      cleanupSuspiciousActivity();
      cleanupSessionTimeout();
    };
  }, [user, session, createSecureSession, monitorSuspiciousActivity, monitorSessionTimeout, performSecurityChecks, generateDeviceFingerprint, logSecurityEvent]);

  return {
    logSecurityEvent,
    createSecureSession,
    securityAlerts,
    sessionTimeoutWarning,
    performSecurityChecks,
    generateDeviceFingerprint
  };
};