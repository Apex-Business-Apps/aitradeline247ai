import { useEffect } from 'react';
import { useEnhancedSessionSecurity } from '@/hooks/useEnhancedSessionSecurity';
import { usePrivacyAnalytics } from '@/hooks/usePrivacyAnalytics';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive Security Monitor Component
 * 
 * This component provides:
 * - Enhanced session security monitoring
 * - Privacy-focused analytics tracking
 * - Client-side security headers
 * - Automated threat detection
 * - Security event logging to analytics_events table
 * 
 * Should be mounted at the app root level
 */
export const SecurityMonitor = () => {
  const { sessionTimeoutWarning } = useEnhancedSessionSecurity();
  const { trackPrivacyPageView, trackPrivacyError } = usePrivacyAnalytics();

  // Enhanced security event logging with rate limiting
  const logSecurityEvent = async (eventType: string, data?: any, severity: 'info' | 'warning' | 'error' | 'critical' = 'info') => {
    try {
      // Rate limiting for security events
      const eventKey = `security_event_${eventType}`;
      const lastEventTime = sessionStorage.getItem(eventKey);
      const now = Date.now();
      
      // Skip if same event was logged in last 5 seconds
      if (lastEventTime && (now - parseInt(lastEventTime)) < 5000) {
        return;
      }
      sessionStorage.setItem(eventKey, now.toString());

      await supabase.functions.invoke('secure-analytics', {
        body: {
          event_type: eventType,
          event_data: data || {},
          severity,
          session_id: sessionStorage.getItem('session_id') || undefined
        }
      });
    } catch (error) {
      // Fail silently to prevent recursion and console spam
    }
  };

  useEffect(() => {
    // Generate session ID for tracking if not exists
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', crypto.randomUUID());
    }

    // Set enhanced security headers
    const setSecurityHeaders = () => {
      // Content Security Policy for production
      if (window.location.hostname !== 'localhost') {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://supabase.co https://*.supabase.co https://cdn.gpteng.co https://www.googletagmanager.com https://static.klaviyo.com https://static-tracking.klaviyo.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://cdn.gpteng.co https://www.googletagmanager.com https://static.klaviyo.com https://static-tracking.klaviyo.com",
          "media-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests"
        ].join('; ');
        document.head.appendChild(meta);
        
        logSecurityEvent('csp_headers_applied', { 
          hostname: window.location.hostname,
          csp_directives: meta.content.split('; ').length 
        });
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

      logSecurityEvent('security_headers_applied', { headers_count: headers.length });
    };

    // Enhanced error monitoring with privacy protection
    const setupErrorMonitoring = () => {
      const originalError = console.error;
      console.error = (...args) => {
        // Log security-relevant errors only
        const errorMessage = args.join(' ');
        if (errorMessage.toLowerCase().includes('security') || 
            errorMessage.toLowerCase().includes('auth') ||
            errorMessage.toLowerCase().includes('unauthorized') ||
            errorMessage.toLowerCase().includes('csp') ||
            errorMessage.toLowerCase().includes('cors')) {
          
          logSecurityEvent('security_error_detected', {
            error_type: 'console_error',
            message: errorMessage.substring(0, 500) // Limit message length
          }, 'warning');
          
          trackPrivacyError('security_error', errorMessage);
        }
        originalError.apply(console, args);
      };

      // Global error handler
      window.addEventListener('error', (event) => {
        if (event.error?.name === 'SecurityError' || 
            event.message?.includes('security') ||
            event.message?.includes('auth') ||
            event.message?.includes('Content Security Policy')) {
          
          logSecurityEvent('global_error_detected', {
            error_name: event.error?.name,
            message: event.message?.substring(0, 500),
            filename: event.filename?.substring(event.filename.lastIndexOf('/') + 1),
            line: event.lineno
          }, 'error');
          
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
            reason.toLowerCase().includes('auth') ||
            reason.toLowerCase().includes('unauthorized')) {
          
          logSecurityEvent('unhandled_rejection_detected', {
            reason: reason.substring(0, 500)
          }, 'warning');
          
          trackPrivacyError('unhandled_rejection', reason);
        }
      });
    };

    // Device and browser security monitoring (with reduced frequency)
    const monitorDeviceSecurity = () => {
      let devToolsOpen = false;
      let suspiciousActivityCount = 0;
      const threshold = 160;
      
      const checkDevTools = () => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
          if (!devToolsOpen) {
            devToolsOpen = true;
            logSecurityEvent('devtools_opened', {
              screen_resolution: `${window.screen.width}x${window.screen.height}`,
              window_size: `${window.innerWidth}x${window.innerHeight}`
            });
            trackPrivacyError('security_alert', 'Developer tools potentially opened', 'no_context');
          }
        } else {
          devToolsOpen = false;
        }
      };

      // Reduced frequency to prevent excessive API calls
      const devToolsInterval = setInterval(checkDevTools, 15000); // Changed from 5000 to 15000

      // Enhanced suspicious extension detection (run only once)
      const checkExtensions = () => {
        const suspiciousKeywords = ['wallet', 'crypto', 'password', 'autofill', 'inject'];
        const scripts = Array.from(document.querySelectorAll('script'));
        
        scripts.forEach(script => {
          if (script.src && suspiciousKeywords.some(keyword => 
            script.src.toLowerCase().includes(keyword))) {
            suspiciousActivityCount++;
            logSecurityEvent('suspicious_extension_detected', {
              script_domain: new URL(script.src).hostname,
              keyword_matched: suspiciousKeywords.find(k => script.src.toLowerCase().includes(k))
            }, 'warning');
          }
        });

        // Check for common extension modification patterns
        const suspiciousElements = document.querySelectorAll('[class*="extension"], [id*="extension"]');
        if (suspiciousElements.length > 0) {
          logSecurityEvent('extension_elements_detected', {
            element_count: suspiciousElements.length
          }, 'info');
          trackPrivacyError('security_alert', `Potential browser extensions detected: ${suspiciousElements.length}`, 'no_context');
        }

        // Monitor for excessive DOM manipulation (throttled)
        let mutationCount = 0;
        const observer = new MutationObserver((mutations) => {
          mutationCount++;
          // Only log every 100th mutation to prevent spam
          if (mutationCount % 100 === 0) {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList' && mutation.addedNodes.length > 20) {
                suspiciousActivityCount++;
                if (suspiciousActivityCount > 10) {
                  logSecurityEvent('excessive_dom_manipulation', {
                    mutations_count: mutation.addedNodes.length,
                    suspicious_count: suspiciousActivityCount,
                    total_mutations: mutationCount
                  }, 'warning');
                }
              }
            });
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      };

      // Only run extension check once after page load
      setTimeout(checkExtensions, 5000);

      return () => {
        clearInterval(devToolsInterval);
      };
    };

    // Initialize security measures
    setSecurityHeaders();
    setupErrorMonitoring();
    const cleanupDeviceMonitoring = monitorDeviceSecurity();

    // Track initial security initialization
    trackPrivacyPageView(window.location.pathname);
    logSecurityEvent('security_monitor_initialized', {
      user_agent: navigator.userAgent.substring(0, 200),
      url: window.location.href,
      timestamp: new Date().toISOString()
    });

    return cleanupDeviceMonitoring;
  }, [trackPrivacyPageView, trackPrivacyError]);

  // Visual indicator for session timeout warning
  useEffect(() => {
    if (sessionTimeoutWarning) {
      document.body.classList.add('session-warning');
      logSecurityEvent('session_timeout_warning_shown', {
        url: window.location.href
      }, 'warning');
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