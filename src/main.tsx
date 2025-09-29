import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/roi-table.css";
import { wireSpaRouter } from "./lib/klaviyo";
import { watchRoiTableCanon } from "./lib/roiTableFix";
import { initPWAInstall } from "./lib/pwaInstall";
import { initHeroGuardian } from "./lib/heroGuardian";

createRoot(document.getElementById("root")!).render(<App />);

// Wire SPA router tracking after app mounts
wireSpaRouter(() => location.pathname);
watchRoiTableCanon();
initPWAInstall();

// Initialize hero guardian for permanent safeguards
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(initHeroGuardian, 1500);
  });
}
