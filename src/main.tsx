import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/roi-table.css";
import "./styles/micro-interactions.css";
import "./i18n/config";
import "./styles/reset.css";
import "./styles/layout.css";
import "./styles/header-lock.css"; // must be last
import { watchRoiTableCanon } from "./lib/roiTableFix";
import { initPWAInstall } from "./lib/pwaInstall";
import { initHeroGuardian } from "./lib/heroGuardian";
import { verifyHeaderFlush } from "./lib/verifyHeaderFlush";

createRoot(document.getElementById("root")!).render(<App />);

watchRoiTableCanon();
initPWAInstall();

// Initialize hero guardian for permanent safeguards
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(initHeroGuardian, 1500);
  });
  
  // Verification available in console via: verifyHeaderFlush()
  console.log('💡 Run verifyHeaderFlush() in console to verify header flushness');
}
