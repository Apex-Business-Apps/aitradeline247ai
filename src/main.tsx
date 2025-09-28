import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// Wire SPA router tracking after app mounts
wireSpaRouter(() => location.pathname);
watchRoiTableCanon();
startGAAutotrack();
startKlaviyoAutoCapture();
