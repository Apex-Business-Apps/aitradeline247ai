import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/a11y-canon.css";
import "./styles/roi-table.css";
import { wireSpaRouter } from "./lib/klaviyo";
import { watchRoiTableCanon } from "./lib/roiTableFix";
import { initPWAInstall } from "./lib/pwaInstall";
import { startGAAutotrack } from "./lib/ga-autotrack";
import { startKlaviyoAutoCapture } from "./lib/klaviyo-autocapture";

createRoot(document.getElementById("root")!).render(<App />);

// Wire SPA router tracking after app mounts
wireSpaRouter(() => location.pathname);
watchRoiTableCanon();
initPWAInstall();
startGAAutotrack();
startKlaviyoAutoCapture();
