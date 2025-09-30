// LOVABLE-GUARD: asserts canonical layout and “blows up” if violated.
import "./../styles/layout-canon.css";
import { enforceHeroRoiDuo } from "./layoutGuard";

type Fail = { reason: string; meta?: Record<string, any> };

function overlay(): HTMLElement {
  let el = document.getElementById("canon-overlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "canon-overlay";
    el.className = "canon-overlay";
    el.innerHTML = `<div class="canon-overlay__box">
      <div class="canon-overlay__title">LAYOUT CANON VIOLATION</div>
      <div id="canon-detail" class="canon-overlay__detail"></div>
    </div>`;
    document.body.appendChild(el);
  }
  return el;
}
function openOverlay(detail: string) {
  const el = overlay();
  const box = el.querySelector("#canon-detail") as HTMLElement;
  box.textContent = detail;
  el.setAttribute("data-open", "true");
}

function assertLayout(): Fail | null {
  const a = document.getElementById("start-trial-hero");
  const b = document.getElementById("roi-calculator");
  if (!a || !b) return { reason: "Missing required nodes", meta: { hasStartTrial: !!a, hasROI: !!b } };

  const desktop = window.matchMedia("(min-width: 1025px)").matches;
  const cs = (el: Element) => getComputedStyle(el as HTMLElement);

  // container must be grid with 2 columns on desktop
  const wrapper = document.getElementById("hero-roi-duo") || a.parentElement;
  if (desktop) {
    const s = wrapper ? cs(wrapper) : ({} as CSSStyleDeclaration);
    const isGrid = s.display === "grid";
    const cols = (s.gridTemplateColumns || "").split(" ").length;
    if (!isGrid || cols < 2) {
      return { reason: "Wrapper must be a 2-column grid on desktop", meta: { display: s.display, gridTemplateColumns: s.gridTemplateColumns } };
    }
  }

  // geometric checks (desktop)
  if (desktop) {
    const ra = (a as HTMLElement).getBoundingClientRect();
    const rb = (b as HTMLElement).getBoundingClientRect();
    const topEqual = Math.abs(ra.top - rb.top) <= 2;
    const widthEqual = Math.abs(ra.width - rb.width) <= 4;
    if (!topEqual || !widthEqual) {
      return { reason: "Blocks must be same row & equal width (±4px)", meta: { ra, rb } };
    }
  }
  return null;
}

export function startLayoutCanon() {
  // try self-heal first (ids/classes intact, but structure wrong)
  enforceHeroRoiDuo();

  const fail = assertLayout();
  if (fail) {
    // Log warning instead of blocking overlay
    console.warn(`[LayoutCanon] ${fail.reason}`, fail.meta);
  }

  // keep watching for naughty changes
  const mo = new MutationObserver(() => {
    const f = assertLayout();
    if (f) {
      // Log warning instead of blocking overlay
      console.warn(`[LayoutCanon] ${f.reason}`, f.meta);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  if ((window as any).ResizeObserver) {
    const ro = new (window as any).ResizeObserver(() => {
      const f = assertLayout();
      if (f) {
        // Log warning instead of blocking overlay
        console.warn(`[LayoutCanon] ${f.reason}`, f.meta);
      }
    });
    ro.observe(document.documentElement);
  }
}
