// Minimal SPA wiring for Klaviyo
declare global {
  interface Window {
    klaviyo?: { push: (...args: any[]) => void };
    __klaviyo_wired?: boolean;
  }
}

export function klaviyoReady(): boolean {
  return typeof window !== "undefined" && !!window.klaviyo?.push;
}

export function trackPage(path = location.pathname) {
  if (!klaviyoReady()) return;
  // Custom page event (Klaviyo supports custom events via JS track)
  window.klaviyo!.push(["track", "Page Viewed", { path, title: document.title }]);
}

export function identifyUser(props: Record<string, any>) {
  if (!klaviyoReady()) return;
  // Identify current visitor (email/phone/name accepted per API)
  window.klaviyo!.push(["identify", props]);
}

export function trackEvent(name: string, props?: Record<string, any>) {
  if (!klaviyoReady()) return;
  window.klaviyo!.push(["track", name, props || {}]);
}

export function wireSpaRouter(onPath?: () => string) {
  if (window.__klaviyo_wired) return;
  window.__klaviyo_wired = true;

  // Initial page
  trackPage();

  // Listen for SPA navigations (popstate + pushState/replaceState)
  const fire = () => trackPage(onPath ? onPath() : location.pathname);
  const _ps = history.pushState; const _rs = history.replaceState;
  history.pushState = function(...a){ _ps.apply(this, a as any); fire(); };
  history.replaceState = function(...a){ _rs.apply(this, a as any); fire(); };
  window.addEventListener("popstate", fire);
}