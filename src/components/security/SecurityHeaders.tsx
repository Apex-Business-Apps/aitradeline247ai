import { useEffect } from 'react';

export const SecurityHeaders = () => {
  useEffect(() => {
    // Set security headers via meta tags where possible
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const setHttpEquivTag = (httpEquiv: string, content: string) => {
      let meta = document.querySelector(`meta[http-equiv="${httpEquiv}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.httpEquiv = httpEquiv;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Enhanced Content Security Policy
    setMetaTag('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://unpkg.com https://js.stripe.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://jbcxceojrztklnvwgyrq.supabase.co wss://jbcxceojrztklnvwgyrq.supabase.co https://api.stripe.com; " +
      "frame-src https://js.stripe.com https://hooks.stripe.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "upgrade-insecure-requests;"
    );

    // Additional security headers
    setHttpEquivTag('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    setMetaTag('X-Content-Type-Options', 'nosniff');
    setMetaTag('X-Frame-Options', 'DENY');
    setMetaTag('X-XSS-Protection', '1; mode=block');
    setMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');
    setMetaTag('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), autoplay=(), encrypted-media=()'
    );

    // Generate and store CSRF token
    let csrfToken = sessionStorage.getItem('csrf-token');
    if (!csrfToken) {
      csrfToken = crypto.randomUUID();
      sessionStorage.setItem('csrf-token', csrfToken);
    }
    
    // Add CSRF token to all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      let csrfInput = form.querySelector('input[name="csrf-token"]') as HTMLInputElement;
      if (!csrfInput) {
        csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf-token';
        form.appendChild(csrfInput);
      }
      csrfInput.value = csrfToken;
    });

    // Enhanced security monitoring
    const securityMonitor = () => {
      // Monitor for security errors
      window.addEventListener('error', (event) => {
        if (event.error?.name === 'SecurityError') {
          console.warn('Security violation detected:', {
            message: event.error.message,
            filename: event.filename,
            lineno: event.lineno,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Monitor for CSP violations
      document.addEventListener('securitypolicyviolation', (event) => {
        console.warn('CSP Violation:', {
          directive: event.violatedDirective,
          blockedURI: event.blockedURI,
          source: event.sourceFile,
          line: event.lineNumber,
          timestamp: new Date().toISOString()
        });
      });

      // Monitor for suspicious DOM modifications
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                // Check for suspicious script injections
                if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-expected')) {
                  console.warn('Unexpected script element added:', element.outerHTML);
                }
              }
            });
          }
        });
      });

      observer.observe(document.head, { childList: true, subtree: true });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    securityMonitor();

  }, []);

  return null; // This component only sets headers, no UI
};