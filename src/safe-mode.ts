/**
 * Safe Mode - Prevents blank preview screens
 * Activated via ?safe=1 URL parameter
 */

// Check if safe mode is requested
const urlParams = new URLSearchParams(window.location.search);
const isSafeMode = urlParams.get('safe') === '1';

if (isSafeMode) {
  // Set global flag
  (window as any).__SAFE_MODE__ = true;
  
  console.log('🛡️ SAFE MODE ACTIVE');
  
  // 1. Unregister all service workers immediately
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('🛡️ Safe Mode: Unregistered service worker');
      });
    });
  }
  
  // 2. Inject styles to disable animations and hide overlays
  const safeStyles = document.createElement('style');
  safeStyles.id = 'safe-mode-styles';
  safeStyles.textContent = `
    /* Disable animations and transitions */
    * {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
    
    /* Hide common full-screen overlays */
    [data-overlay],
    [role="dialog"]:not([data-safe-allowed]),
    .overlay:not([data-safe-allowed]),
    [data-portal]:not([data-safe-allowed]) {
      display: none !important;
    }
    
    /* Ensure content is visible */
    html, body, #root {
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    /* Visual indicator */
    body::before {
      content: "🛡️ SAFE MODE";
      position: fixed;
      top: 0;
      right: 0;
      background: #ff6b35;
      color: white;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: bold;
      z-index: 99999;
      pointer-events: none;
    }
  `;
  document.head.appendChild(safeStyles);
  
  // 3. Add data attribute to HTML element
  document.documentElement.setAttribute('data-safe', '1');
}

// Always unregister service workers in development
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('🔧 Dev Mode: Unregistered service worker');
    });
  });
}

export { isSafeMode };
