import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/roi-table.css";
import "./styles/header-align.css";
import "./styles/overrides.css";
import "./styles/mobile-lead-form.css";
import "./styles/leadform-mobile-fix.css";
import "./i18n/config";
import { watchRoiTableCanon } from "./lib/roiTableFix";
import { initPWAInstall } from "./lib/pwaInstall";
import { initHeroGuardian } from "./lib/heroGuardian";
import { initChatSafeGap } from "./ux/chat-safe-gap";
import { initLayoutTripwire } from "./lib/layoutTripwire";

createRoot(document.getElementById("root")!).render(<App />);

watchRoiTableCanon();
initPWAInstall();
initChatSafeGap();
initLayoutTripwire(); // Initialize tripwire guard (dev/CI only)

// Initialize hero guardian for permanent safeguards
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(initHeroGuardian, 1500);
  });
}
