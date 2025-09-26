import React from "react";
import { startPWAInstallBridge, promptInstall, onPWAStateChange } from "../lib/pwa-install";

type S = { canInstall: boolean; installed: boolean; isIOS: boolean; inStandalone: boolean };

export default function PWAInstall(){
  const [s, setS] = React.useState<S>({ canInstall:false, installed:false, isIOS:false, inStandalone:false });
  React.useEffect(() => {
    startPWAInstallBridge();
    const cleanup = onPWAStateChange(setS);
    return () => {
      cleanup();
    };
  }, []);

  if (s.installed || s.inStandalone) return null;

  // iOS Safari: show helper steps; others: show 1-click button when canInstall=true
  return (
    <div style={{
      position: "fixed", inset: "auto 16px 16px auto", zIndex: 50,
      background: "#141414", color: "#fff", padding: "10px 12px",
      borderRadius: 12, boxShadow: "0 6px 24px rgba(0,0,0,.28)"
    }} role="status" aria-live="polite">
      {!s.isIOS ? (
        <button
          onClick={async () => {
            const res = await promptInstall(); /* accepted|dismissed|unavailable */
            (window as any).gtag?.("event", "pwa_install_click", { result: res });
          }}
          disabled={!s.canInstall}
          style={{ fontWeight: 600, padding: "8px 12px", borderRadius: 10, cursor: s.canInstall ? "pointer" : "not-allowed" }}
          aria-disabled={!s.canInstall}
        >
          {s.canInstall ? "Install App" : "Install Unavailable"}
        </button>
      ) : (
        <div style={{ maxWidth: 260 }}>
          <strong>Add to Home Screen</strong>
          <div style={{ fontSize: 12, opacity: .9, marginTop: 4 }}>
            In Safari: <em>Share</em> → <em>Add to Home Screen</em>.
          </div>
        </div>
      )}
    </div>
  );
}