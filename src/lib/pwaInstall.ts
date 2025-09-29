// PWA install prompt management
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function initPWAInstall() {
  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Dispatch custom event to signal PWA is ready
    window.dispatchEvent(new CustomEvent('tl247:pwa-ready', { 
      detail: { prompt: deferredPrompt } 
    }));
  });

  // For testing - manual trigger
  window.addEventListener('tl247:pwa-ready', () => {
    mountPWABanner();
  });
}

export function getPWAPrompt() {
  return deferredPrompt;
}

export async function installPWA() {
  if (!deferredPrompt) return false;
  
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      deferredPrompt = null;
      removePWABanner();
      return true;
    }
  } catch (error) {
    console.error('PWA install failed:', error);
  }
  
  return false;
}

function mountPWABanner() {
  // Check if banner already exists
  if (document.querySelector('#pwa-install-banner')) return;
  
  // Create and mount banner
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  document.body.appendChild(banner);
  
  // Import and render component dynamically
  import('../components/PWAInstallBanner').then(({ PWAInstallBanner }) => {
    const React = require('react');
    const { createRoot } = require('react-dom/client');
    const root = createRoot(banner);
    root.render(React.createElement(PWAInstallBanner));
  });
}

function removePWABanner() {
  const banner = document.querySelector('#pwa-install-banner');
  if (banner) {
    banner.remove();
  }
}