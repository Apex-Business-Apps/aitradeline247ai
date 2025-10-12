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

// Canonical domain redirect (ONLY on www.tradeline247ai.com)
// Skip for dev, preview (lovable.app), and other non-production environments
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isWWW = hostname === 'www.tradeline247ai.com';
  const isApex = hostname === 'tradeline247ai.com';
  const isPreview = hostname.endsWith('.lovable.app') || hostname.endsWith('.lovable.dev');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Only redirect apex to www in actual production, not in preview/dev
  if (isApex && !isPreview && !isLocalhost && !window.location.pathname.startsWith('/auth/callback')) {
    const canonical = 'https://www.tradeline247ai.com';
    const target = canonical + window.location.pathname + window.location.search + window.location.hash;
    console.log('↪️ Redirecting apex to www:', target);
    window.location.replace(target);
  } else if (isPreview || isLocalhost) {
    console.log('🔧 Preview/Dev environment detected, skipping canonical redirect');
  } else if (isWWW) {
    console.log('✅ Canonical domain (www)');
  }
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
