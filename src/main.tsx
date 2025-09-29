import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./router";
import EmergencyApp from "./EmergencyApp";
import { installGlobalTraps } from "./bootstrap-safety";

createRoot(document.getElementById("root")!).render(<React.StrictMode><AppRouter/></React.StrictMode>);

const rootEl = document.getElementById("root")!;
installGlobalTraps(()=>{
  rootEl.innerHTML="";
  import("react-dom/client").then(({createRoot})=>createRoot(rootEl).render(<EmergencyApp/>));
});