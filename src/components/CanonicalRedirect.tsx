import { useEffect } from 'react';

/**
 * CanonicalRedirect Component
 * 
 * Handles redirecting apex domain to www subdomain AFTER React has mounted.
 * This prevents blank screens that occur when redirects happen before app initialization.
 * 
 * Only redirects:
 * - tradeline247ai.com -> www.tradeline247ai.com
 * 
 * Does NOT redirect:
 * - Lovable preview environments (.lovableproject.com, .lovable.app, .lovable.dev)
 * - Local development (localhost, 127.0.0.1, .local, 192.168.x.x)
 * - Auth callback routes
 */
export const CanonicalRedirect = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Check if this is a preview environment
    const isPreview = hostname.endsWith('.lovableproject.com') || 
                      hostname.endsWith('.lovable.app') || 
                      hostname.endsWith('.lovable.dev');
    
    // Check if this is local development
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' ||
                       hostname.startsWith('192.168.') ||
                       hostname.endsWith('.local');

    // Check if this is the apex domain (without www)
    const isApex = hostname === 'tradeline247ai.com';

    // Check if this is already www
    const isWWW = hostname === 'www.tradeline247ai.com';

    // Skip auth callback routes to prevent redirect loops
    const isAuthCallback = pathname.startsWith('/auth/callback');

    // Only redirect if:
    // 1. We're on the apex domain
    // 2. NOT in preview or localhost
    // 3. NOT on an auth callback route
    if (isApex && !isPreview && !isLocalhost && !isAuthCallback) {
      const canonical = 'https://www.tradeline247ai.com';
      const target = canonical + pathname + window.location.search + window.location.hash;
      
      console.log('↪️ Canonical redirect: apex → www', {
        from: window.location.href,
        to: target
      });
      
      window.location.replace(target);
    } else {
      // Log environment for debugging
      if (isPreview) {
        console.log('🔧 Preview environment detected, no redirect needed');
      } else if (isLocalhost) {
        console.log('🔧 Local development environment, no redirect needed');
      } else if (isWWW) {
        console.log('✅ Already on canonical domain (www)');
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
};
