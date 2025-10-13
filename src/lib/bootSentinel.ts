/**
 * Boot Sentinel
 * 
 * Silent runtime check to detect if React app fails to mount.
 * Reports telemetry only (no UI changes).
 * 
 * Runs 3s after DOMContentLoaded to allow for lazy/async loading.
 */

const BOOT_TIMEOUT_MS = 3000;
const TELEMETRY_ENDPOINT = '/api/telemetry';

export function initBootSentinel(): void {
  // Skip in dev mode
  if (import.meta.env.DEV) {
    return;
  }

  // Skip if already initialized
  if (window.__BOOT_SENTINEL_ACTIVE__) {
    return;
  }

  window.__BOOT_SENTINEL_ACTIVE__ = true;

  const checkBoot = () => {
    const root = document.getElementById('root');
    
    if (!root) {
      reportBootFailure('root_element_missing');
      return;
    }

    // Check if React mounted (root has children)
    const hasChildren = root.children.length > 0;
    const hasText = root.textContent && root.textContent.trim().length > 0;

    if (!hasChildren && !hasText) {
      reportBootFailure('react_not_mounted');
      window.__BOOT_TIMEOUT__ = true;
    }
  };

  const reportBootFailure = (reason: string) => {
    const data = {
      type: 'boot_failure',
      reason,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      buildId: window.__BUILD_ID__ || 'unknown',
    };

    // Silent telemetry (no console spam)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(TELEMETRY_ENDPOINT, JSON.stringify(data));
    } else {
      // Fallback for older browsers
      fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        // Silent failure - telemetry is best-effort
      });
    }

    console.warn('[BootSentinel] Boot failure detected:', reason);
  };

  // Schedule check 3s after page interactive
  if (document.readyState === 'complete') {
    setTimeout(checkBoot, BOOT_TIMEOUT_MS);
  } else {
    window.addEventListener('load', () => {
      setTimeout(checkBoot, BOOT_TIMEOUT_MS);
    });
  }
}

// Type augmentation
declare global {
  interface Window {
    __BOOT_SENTINEL_ACTIVE__?: boolean;
    __BOOT_TIMEOUT__?: boolean;
    __BUILD_ID__?: string;
  }
}
