import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/reset.css";
import "./styles/layout.css";
import "./index.css";
import "./styles/roi-table.css";
import "./styles/micro-interactions.css";
import "./i18n/config";
import { watchRoiTableCanon } from "./lib/roiTableFix";
import { initPWAInstall } from "./lib/pwaInstall";
import { initHeroGuardian } from "./lib/heroGuardian";
import { watchBannerHeight } from "./lib/bannerHeight";

createRoot(document.getElementById("root")!).render(<App />);

watchRoiTableCanon();
initPWAInstall();
watchBannerHeight();

// Initialize hero guardian for permanent safeguards
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(initHeroGuardian, 1500);
  });
}
