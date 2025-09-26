// PWA: register SW and mount banner (no other changes)
import PWAInstall from "./components/PWAInstall";
import React from "react";
import ReactDOM from "react-dom/client";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/a11y-canon.css";
import "./styles/roi-table.css";
import { wireSpaRouter } from "./lib/klaviyo";
import { watchRoiTableCanon } from "./lib/roiTableFix";
import { startGAAutotrack } from "./lib/ga-autotrack";
import { startKlaviyoAutoCapture } from "./lib/klaviyo-autocapture";

// PWA: register SW
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}

// Mount PWAInstall into a portal so layout doesn't shift
const mount = document.createElement("div");
document.body.appendChild(mount);
ReactDOM.createRoot(mount).render(React.createElement(PWAInstall));

createRoot(document.getElementById("root")!).render(<App />);

// Wire SPA router tracking after app mounts
wireSpaRouter(() => location.pathname);
watchRoiTableCanon();
startGAAutotrack();
startKlaviyoAutoCapture();
