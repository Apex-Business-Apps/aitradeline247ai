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

createRoot(document.getElementById("root")!).render(<App />);

watchRoiTableCanon();
initPWAInstall();

// Initialize hero guardian for permanent safeguards
if (typeof window !== 'undefined') {
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
}
