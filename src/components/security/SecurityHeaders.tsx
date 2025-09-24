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

    // Content Security Policy (restrictive but functional)
    setMetaTag('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://jbcxceojrztklnvwgyrq.supabase.co wss://jbcxceojrztklnvwgyrq.supabase.co; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );

    // Additional security headers
    setMetaTag('X-Content-Type-Options', 'nosniff');
    setMetaTag('X-Frame-Options', 'DENY');
    setMetaTag('X-XSS-Protection', '1; mode=block');
    setMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');
    setMetaTag('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
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

  }, []);

  return null; // This component only sets headers, no UI
};