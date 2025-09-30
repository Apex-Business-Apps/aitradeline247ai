import { useEffect } from 'react';
import { useEnhancedSessionSecurity } from '@/hooks/useEnhancedSessionSecurity';
import { usePrivacyAnalytics } from '@/hooks/usePrivacyAnalytics';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { useSecureAnalytics } from '@/hooks/useSecureAnalytics';

/**
 * Comprehensive Security Monitor Component
 * 
 * This component provides:
 * - Enhanced session security monitoring
 * - Privacy-focused analytics tracking
 * - Client-side security headers
 * - Automated threat detection
 * 
 * Should be mounted at the app root level
 */
export const SecurityMonitor = () => {
  const { sessionTimeoutWarning } = useEnhancedSessionSecurity();
  const { trackPrivacyPageView, trackPrivacyError } = usePrivacyAnalytics();

  useEffect(() => {
    // Set enhanced security headers
    const setSecurityHeaders = () => {
      // Content Security Policy for production
      if (window.location.hostname !== 'localhost') {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://supabase.co https://*.supabase.co",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
          "media-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests"
        ].join('; ');
        document.head.appendChild(meta);
      }

      // Additional security headers
      const headers = [
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'X-Frame-Options', content: 'DENY' },
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
        { name: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=()' },
      ];

      headers.forEach(({ name, content }) => {
        let meta = document.querySelector(`meta[http-equiv="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          (meta as HTMLMetaElement).httpEquiv = name;
          document.head.appendChild(meta);
        }
        (meta as HTMLMetaElement).content = content;
      });
    };

    // Enhanced error monitoring with privacy protection
    const setupErrorMonitoring = () => {
      const originalError = console.error;
      console.error = (...args) => {
        // Log security-relevant errors only
        const errorMessage = args.join(' ');
        if (errorMessage.toLowerCase().includes('security') || 
            errorMessage.toLowerCase().includes('auth') ||
            errorMessage.toLowerCase().includes('unauthorized')) {
          trackPrivacyError('security_error', errorMessage);
        }
        originalError.apply(console, args);
      };

      // Global error handler
      window.addEventListener('error', (event) => {
        if (event.error?.name === 'SecurityError' || 
            event.message?.includes('security') ||
            event.message?.includes('auth')) {
          trackPrivacyError('global_error', event.message || 'Unknown security error', {
            filename: event.filename?.substring(event.filename.lastIndexOf('/') + 1), // Only filename for privacy
            lineno: event.lineno
          });
        }
      });

      // Unhandled promise rejection monitoring
      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason?.toString() || 'Unknown rejection';
        if (reason.toLowerCase().includes('security') || 
            reason.toLowerCase().includes('auth')) {
          trackPrivacyError('unhandled_rejection', reason);
        }
      });
    };

    // Minimal security monitoring - removed aggressive detection
    const monitorDeviceSecurity = () => {
      // Removed dev tools detection to prevent false positives
      // Keep only critical security monitoring
      return () => {}; // No cleanup needed
    };

    // Initialize security measures
    setSecurityHeaders();
    setupErrorMonitoring();
    const cleanupDeviceMonitoring = monitorDeviceSecurity();

    // Track initial security page view
    trackPrivacyPageView(window.location.pathname);

    return cleanupDeviceMonitoring;
  }, [trackPrivacyPageView, trackPrivacyError]);

  // Visual indicator for session timeout warning
  useEffect(() => {
    if (sessionTimeoutWarning) {
      document.body.classList.add('session-warning');
    } else {
      document.body.classList.remove('session-warning');
    }

    return () => {
      document.body.classList.remove('session-warning');
    };
  }, [sessionTimeoutWarning]);

  // This component doesn't render anything visible
  return null;
};