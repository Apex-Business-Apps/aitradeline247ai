/**
 * Safe Mode - Prevents blank preview screens
 * Activated via ?safe=1 URL parameter
 */

const hasWindow = typeof window !== 'undefined';
const urlParams = hasWindow ? new URLSearchParams(window.location.search) : null;
const isSafeMode = hasWindow && urlParams?.get('safe') === '1';

if (hasWindow && isSafeMode) {
  (window as any).__SAFE_MODE__ = true;
  console.log('🛡️ SAFE MODE ACTIVE (?safe=1)');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('🛡️ Safe Mode: Unregistered service worker');
      });
    });
  }

  document.documentElement.setAttribute('data-safe', '1');

  const root = document.getElementById('root');
  if (root) {
    // Forcefully reset styles that could keep the preview blank.
    root.style.setProperty('display', 'block', 'important');
    root.style.setProperty('opacity', '1', 'important');
    root.style.setProperty('visibility', 'visible', 'important');
    root.style.removeProperty('filter');
    root.style.removeProperty('transform');
  }
}

// Always unregister service workers in development
if (hasWindow && import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('🔧 Dev Mode: Unregistered service worker');
    });
  });
}

export { isSafeMode };

