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

// Canonical domain redirect (skip in dev)
if (import.meta.env.PROD && typeof window !== 'undefined') {
  const canonical = 'https://tradeline247ai.com';
  const current = window.location.origin;
  
  if (current !== canonical && !window.location.pathname.startsWith('/auth/callback')) {
    const target = canonical + window.location.pathname + window.location.search + window.location.hash;
    window.location.replace(target);
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
