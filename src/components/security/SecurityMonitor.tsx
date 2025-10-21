import { useEffect, useRef } from 'react';
import { useEnhancedSessionSecurity } from '@/hooks/useEnhancedSessionSecurity';
import { usePrivacyAnalytics } from '@/hooks/usePrivacyAnalytics';

/**
 * SecurityMonitor (safe-by-default, prod-hardenable)
 *
 * - Default: minimal, zero DOM/CSP mutations → prevents preview white-screens.
 * - Hardened mode: enable via VITE_SECURITY_HARDENED="true"
 *   Adds conservative meta headers idempotently on client only.
 * - All external calls wrapped in try/catch; SSR guarded.
 */

const HARDENED =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_SECURITY_HARDENED === 'true') ||
  (typeof process !== 'undefined' &&
    (process.env as any)?.VITE_SECURITY_HARDENED === 'true');

const addOrUpdateMeta = (name: string, content: string, isHttpEquiv = false) => {
  if (typeof document === 'undefined') return;
  const selector = isHttpEquiv
    ? `meta[http-equiv="${name}"]`
    : `meta[name="${name}"]`;
  let meta = document.querySelector(selector) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    if (isHttpEquiv) meta.httpEquiv = name;
    else meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
};

const applyConservativeHeaders = () => {
  if (typeof window === 'undefined') return;
  // Only apply on custom domains / real prod; skip localhost, *.vercel.app, *.lovable.app previews
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host.endsWith('.local');
  const isPreview = host.endsWith('.vercel.app') || host.includes('lovable.app');
  if (isLocal || isPreview) return;

  // Idempotent, conservative CSP — avoids breaking common CDNs and Supabase.
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
    // If you load inline or evaluated scripts, keep these; otherwise remove to tighten.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    'upgrade-insecure-requests',
  ].join('; ');
  addOrUpdateMeta('Content-Security-Policy', csp, true);

  addOrUpdateMeta('Referrer-Policy', 'strict-origin-when-cross-origin', true);
  addOrUpdateMeta('X-Content-Type-Options', 'nosniff', true);
  addOrUpdateMeta('X-Frame-Options', 'DENY', true);
  addOrUpdateMeta('Permissions-Policy', 'geolocation=(), microphone=(), camera=()', true);
};

export const SecurityMonitor = () => {
  const initOnce = useRef(false);
  const { recordActivity } = useEnhancedSessionSecurity();
  const { trackPrivacyPageView, trackPrivacyError } = usePrivacyAnalytics();

  // Minimal, always-on: record activity + page view (client-only)
  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    // record activity (best-effort)
    try {
      recordActivity?.();
    } catch (e) {
      try {
        trackPrivacyError?.('record_activity_error', (e as Error)?.message || 'unknown');
      } catch {}
    }

    // page view (client only)
    if (typeof window !== 'undefined') {
      try {
        trackPrivacyPageView?.(window.location.pathname);
      } catch (e) {
        try {
          trackPrivacyError?.('page_view_error', (e as Error)?.message || 'unknown');
        } catch {}
      }
    }

    // Hardened mode is opt-in to avoid preview/iframe issues
    if (HARDENED) {
      try {
        applyConservativeHeaders();
      } catch (e) {
        try {
          trackPrivacyError?.('header_apply_error', (e as Error)?.message || 'unknown');
        } catch {}
      }
    }
    // no cleanup: metas are idempotent and harmless across navigations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default SecurityMonitor;
