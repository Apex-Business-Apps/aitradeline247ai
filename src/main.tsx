// ===================================================================
// SIMPLIFIED MOUNTING - Traditional approach with error handling
// ===================================================================
console.log('🚀 TradeLine 24/7 - Starting main.tsx...');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initBootSentinel } from "./lib/bootSentinel";
import { runSwCleanup } from "./lib/swCleanup";
import { featureFlags } from "./config/featureFlags";
import "./i18n/config";

console.log('✅ Core modules loaded');

// H310-1: Dev-only error listener to capture React Error #310
if (import.meta.env.DEV && featureFlags.H310_HARDENING) {
  window.addEventListener('error', (e) => {
    const msg = String(e?.error?.message || '');
    if (msg.includes('Rendered more hooks') || msg.includes('rendered more hooks')) {
      console.info('🚨 H310_CAPTURE - React Hook Order Violation Detected:', {
        message: msg,
        stack: e.error?.stack || e.message,
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    }
  });
  console.log('🛡️ H310 Hardening: Error listener active');
}

// Mount React with error handling
try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('🚀 Mounting React...');
  
  createRoot(rootElement).render(<App />);
  
  console.log('✅ React mounted successfully');
  
  // Run SW cleanup hotfix (one-time, auto-expires after 7 days)
  runSwCleanup().catch(err => console.warn('[SW Cleanup] Failed:', err));
  
  // Initialize boot sentinel (production monitoring only)
  initBootSentinel();
  
  // Load optional features after mount (non-blocking)
  setTimeout(() => {
    import("./styles/roi-table.css").catch(e => console.warn('⚠️ ROI table CSS failed:', e));
    import("./styles/header-align.css").catch(e => console.warn('⚠️ Header align CSS failed:', e));
    
    // Check for safe mode
    const urlParams = new URLSearchParams(window.location.search);
    const isSafeMode = urlParams.get('safe') === '1';
    
    if (!isSafeMode) {
      import("./lib/roiTableFix")
        .then(m => m.watchRoiTableCanon())
        .catch(e => console.warn('⚠️ ROI watcher failed:', e));
      
      import("./lib/pwaInstall")
        .then(m => m.initPWAInstall())
        .catch(e => console.warn('⚠️ PWA install failed:', e));
      
      window.addEventListener('load', () => {
        setTimeout(() => {
          import("./lib/heroGuardian")
            .then(m => m.initHeroGuardian())
            .catch(e => console.warn('⚠️ Hero guardian failed:', e));
        }, 1500);
      });
    } else {
      console.log('🛡️ Safe Mode: Optional features disabled');
    }
  }, 100);
  
} catch (error) {
  console.error('🚨 CRITICAL: React mount failed:', error);
  
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; font-family: system-ui, sans-serif;">
        <div style="max-width: 600px; text-align: center;">
          <h1 style="color: #dc2626; font-size: 2rem; margin-bottom: 1rem;">
            ⚠️ Loading Error
          </h1>
          <p style="color: #4b5563; margin-bottom: 2rem;">
            React failed to mount. Check the console for details.
          </p>
          <button onclick="window.location.reload()" style="background: #ff6b35; color: white; padding: 0.75rem 2rem; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer;">
            Reload Page
          </button>
          <a href="?safe=1" style="display: inline-block; margin-top: 1rem; color: #6b7280; text-decoration: underline;">
            Try Safe Mode
          </a>
          <details style="margin-top: 2rem; text-align: left; background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">
            <summary style="cursor: pointer; font-weight: 600; color: #374151;">Technical Details</summary>
            <pre style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280; white-space: pre-wrap; word-break: break-word;">${String(error)}\n\n${error instanceof Error ? error.stack : ''}</pre>
          </details>
        </div>
      </div>
    `;
  }
}
