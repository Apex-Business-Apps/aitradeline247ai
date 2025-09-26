import React from "react";

export default function PWAQA(){
  const [out, setOut] = React.useState<any>({});
  async function run(){
    const manifest = await fetch("/manifest.webmanifest").then(r => ({ ok: r.ok, text: r.ok ? r.text() : "" })).catch(()=>({ok:false,text:""}));
    const swController = !!navigator.serviceWorker?.controller;
    const bipReady = (window as any).__bip ? true : false;
    const displayStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
    setOut({ manifestOk: manifest.ok, swController, bipReady, displayStandalone });
  }
  return (
    <div style={{maxWidth: 760, margin: "4rem auto", padding: 16}}>
      <h1>PWA QA</h1>
      <button onClick={run}>Run Checks</button>
      <ul style={{listStyle:"none", padding:0, marginTop:12}}>
        <li>manifest.webmanifest: <strong style={{color: out.manifestOk?'green':'crimson'}}>{String(out.manifestOk)}</strong></li>
        <li>SW controller active: <strong style={{color: out.swController?'green':'crimson'}}>{String(out.swController)}</strong></li>
        <li>beforeinstallprompt ready: <strong style={{color: out.bipReady?'green':'orange'}}>{String(out.bipReady)}</strong></li>
        <li>display-mode: standalone: <strong style={{color: out.displayStandalone?'green':'orange'}}>{String(out.displayStandalone)}</strong></li>
      </ul>
      <p style={{opacity:.7, fontSize:12, marginTop:8}}>
        Notes: `beforeinstallprompt` is Chromium-only; `appinstalled` fires on success; iOS uses manual A2HS.
      </p>
    </div>
  );
}