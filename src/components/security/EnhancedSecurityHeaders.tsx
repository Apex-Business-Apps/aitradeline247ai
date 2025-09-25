import { useEffect } from 'react';

export const EnhancedSecurityHeaders = () => {
  useEffect(() => {
    // Enhanced Content Security Policy for production
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ');

    // Set enhanced security headers
    const setMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[http-equiv="${property}"]`) as HTMLMetaElement;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('http-equiv', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    // Enhanced security headers
    setMetaTag('Content-Security-Policy', csp);
    setMetaTag('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    setMetaTag('X-Content-Type-Options', 'nosniff');
    setMetaTag('X-Frame-Options', 'DENY');
    setMetaTag('X-XSS-Protection', '1; mode=block');
    setMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');
    setMetaTag('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

    // Session security monitoring
    const monitorSession = () => {
      // Check for session timeout every 5 minutes
      const sessionCheck = setInterval(() => {
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
          const timeSinceActivity = Date.now() - parseInt(lastActivity);
          // 30 minutes of inactivity
          if (timeSinceActivity > 30 * 60 * 1000) {
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('lastActivity');
            window.location.reload();
          }
        }
      }, 5 * 60 * 1000);

      // Update last activity on user interaction
      const updateActivity = () => {
        localStorage.setItem('lastActivity', Date.now().toString());
      };

      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, updateActivity, true);
      });

      return () => {
        clearInterval(sessionCheck);
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
          document.removeEventListener(event, updateActivity, true);
        });
      };
    };

    const cleanup = monitorSession();

    // Enhanced security monitoring
    const securityMonitor = () => {
      // Simple console access detection without proxying to avoid recursion
      let consoleAccessDetected = false;
      
      const detectConsoleAccess = () => {
        if (!consoleAccessDetected) {
          console.warn('🚨 Security Warning: Console access detected. This may indicate malicious activity.');
          consoleAccessDetected = true;
        }
      };
      
      // Monitor for developer tools opening (simplified approach)
      const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 200;
        const heightThreshold = window.outerHeight - window.innerHeight > 200;
        
        if ((widthThreshold || heightThreshold) && !consoleAccessDetected) {
          detectConsoleAccess();
        }
      };
      
      const devToolsInterval = setInterval(checkDevTools, 1000);

      // Monitor for XSS attempts
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-allowed')) {
                console.error('🚨 Potential XSS: Unauthorized script injection detected');
                element.remove();
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      return () => {
        clearInterval(devToolsInterval);
        observer.disconnect();
      };
    };

    const cleanupMonitor = securityMonitor();

    return () => {
      cleanup();
      cleanupMonitor();
    };
  }, []);

  return null;
};