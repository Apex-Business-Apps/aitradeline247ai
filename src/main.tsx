import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/roi-table.css";
import "./styles/header-align.css";
import "./i18n/config";
import { watchRoiTableCanon } from "./lib/roiTableFix";
import { initPWAInstall } from "./lib/pwaInstall";
import { initHeroGuardian } from "./lib/heroGuardian";
import { performanceMonitor } from "./lib/performanceMonitor";
import SafeErrorBoundary from "./components/errors/SafeErrorBoundary";
import { isSafeMode } from "./safe-mode"; // Initialize safe mode before React mounts

// Environment detection for debugging
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isPreview = hostname.endsWith('.lovableproject.com') || 
                    hostname.endsWith('.lovable.app') || 
                    hostname.endsWith('.lovable.dev');
  const isLocalhost = hostname === 'localhost' || 
                     hostname === '127.0.0.1' ||
                     hostname.startsWith('192.168.') ||
                     hostname.endsWith('.local');
  
  console.log('🚀 TradeLine 24/7 starting...', {
    hostname,
    isPreview,
    isLocalhost,
    pathname: window.location.pathname,
    env: import.meta.env.MODE
  });
  
  // NOTE: Canonical redirect moved to App.tsx to run AFTER React mounts
  // This prevents blank screens caused by redirects before app initialization
}

createRoot(document.getElementById("root")!).render(
  <SafeErrorBoundary>
    <App />
  </SafeErrorBoundary>
);

if (!isSafeMode) {
  watchRoiTableCanon();
  initPWAInstall();
} else {
  console.log("🛡️ Safe Mode: skipping ROI watcher and PWA install");
}

// Initialize hero guardian for permanent safeguards
if (typeof window !== 'undefined') {
  if (!isSafeMode) {
    window.addEventListener('load', () => {
      setTimeout(initHeroGuardian, 1500);
    });

    // Production performance monitoring
    if (import.meta.env.PROD) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const summary = performanceMonitor.getMetricsSummary();
          console.log('📊 Performance Summary:', summary);
        }, 3000);
      });
    }
  } else {
    console.log('🛡️ Safe Mode: hero guardian & performance monitor paused');
  }
}
