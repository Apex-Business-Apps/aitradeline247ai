import { useEffect } from 'react';

/**
 * Security Headers Component
 * Adds client-side security headers and meta tags
 */
export default function SecurityHeaders() {
  useEffect(() => {
    // Add security meta tags
    const securityMetas = [
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { name: 'permissions-policy', content: 'camera=(), microphone=(), geolocation=()' },
      { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
      { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
      { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' },
    ];

    securityMetas.forEach(meta => {
      const existingMeta = document.querySelector(
        `meta[name="${meta.name}"], meta[http-equiv="${meta['http-equiv']}"]`
      );
      
      if (!existingMeta) {
        const metaElement = document.createElement('meta');
        if (meta.name) metaElement.setAttribute('name', meta.name);
        if (meta['http-equiv']) metaElement.setAttribute('http-equiv', meta['http-equiv']);
        metaElement.setAttribute('content', meta.content);
        document.head.appendChild(metaElement);
      }
    });

    // Add Content Security Policy for development
    if (import.meta.env.DEV) {
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!csp) {
        const cspMeta = document.createElement('meta');
        cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
        cspMeta.setAttribute('content', 
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; " +
          "frame-src 'self' https://js.stripe.com;"
        );
        document.head.appendChild(cspMeta);
      }
    }
  }, []);

  return null; // This component only adds meta tags
}