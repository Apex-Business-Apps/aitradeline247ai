type BIP = any; // BeforeInstallPromptEvent (non-standard, Chromium only)

declare global {
  interface Window {
    __bip?: BIP | null;
    __pwa?: {
      canInstall: boolean;
      installed: boolean;
      isIOS: boolean;
      inStandalone: boolean;
      onChange: Set<(s: any) => void>;
    };
  }
}

function state() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
  const inStandalone =
    // iOS Safari
    (navigator as any).standalone === true ||
    // All: CSS media query
    window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  return {
    canInstall: !!window.__bip,
    installed: inStandalone,
    isIOS,
    inStandalone
  };
}

function notify() {
  const s = state();
  window.__pwa?.onChange.forEach((fn) => fn(s));
}

export function startPWAInstallBridge() {
  if (!window.__pwa) window.__pwa = { ...state(), onChange: new Set() } as any;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    // Chromium only; non-standard. Save it for 1-click after gesture. 3
    e.preventDefault?.();
    window.__bip = e as BIP;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    // Fires after successful install. 4
    window.__bip = null;
    notify();
    // Fire GA4 'install' if available
    (window as any).gtag?.("event", "install", { method: "pwa", page_location: location.href });
  });

  // Initial notify
  notify();
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const bip = window.__bip as any;
  if (!bip) return "unavailable";
  // MDN: call prompt() only after a user gesture; await outcome. 5
  await bip.prompt?.();
  const outcome = await (bip.userChoice || Promise.resolve({ outcome: "dismissed" }));
  window.__bip = null; // Some browsers clear it after prompt
  notify();
  return outcome.outcome || "dismissed";
}

export function onPWAStateChange(fn: (s: any) => void) {
  window.__pwa?.onChange.add(fn);
  return () => window.__pwa?.onChange.delete(fn);
}