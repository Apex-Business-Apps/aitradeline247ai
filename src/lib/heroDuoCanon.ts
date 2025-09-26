// LOVABLE-GUARD: Canon + auto-heal + overlay. Idempotent and tiny.
type Fail = { reason: string; meta?: Record<string, any> };

function qs<T extends Element>(sel: string): T | null { return document.querySelector(sel) as T | null; }
function ensureOverlay(): HTMLElement {
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
function blowUp(detail: string) {
  const el = ensureOverlay();
  (qs<HTMLElement>("#canon-detail")!).textContent = detail;
  el.setAttribute("data-open","true");
  if (import.meta.env.MODE !== "production") throw new Error(detail);
}

/** 1) Auto-heal structure and centering classes */
export function ensureHeroDuoStructure() {
  const a = document.getElementById("start-trial-hero");
  const b = document.getElementById("roi-calculator");
  if (!a || !b) return;

  // Wrap into grid
  let grid = document.getElementById("hero-roi-duo");
  if (!grid) {
    grid = document.createElement("div");
    grid.id = "hero-roi-duo";
    grid.className = "hero-roi__grid";
    const first = (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? a : b;
    first.parentElement?.insertBefore(grid, first);
  }
  if (a.parentElement !== grid) grid.appendChild(a);
  if (b.parentElement !== grid) grid.appendChild(b);

  // Outer container
  if (!grid.parentElement?.classList.contains("hero-roi__container")) {
    const container = document.createElement("div");
    container.className = "hero-roi__container";
    grid.parentElement?.insertBefore(container, grid);
    container.appendChild(grid);
  }
}

/** 2) Lock title gap: give the heading a stable id and enforce 2 cm spacing */
export function ensureHeroTitleGap() {
  // find the heading immediately preceding the duo; prefer a heading with this text
  const headingText = /help us help you/i;
  let title: HTMLElement | null =
    Array.from(document.querySelectorAll("h1,h2,h3")).find(h => headingText.test(h.textContent || "")) as HTMLElement | null;

  // fallback: previous sibling heading of the container
  const container = qs<HTMLElement>(".hero-roi__container");
  if (!title && container) {
    let prev = container.previousElementSibling as HTMLElement | null;
    while (prev && !/H[1-6]/.test(prev.tagName)) prev = prev.previousElementSibling as HTMLElement | null;
    title = prev;
  }
  if (title) title.id = "hero-duo-title";
}

/** 3) Assert canon: centered tracks, equal widths, same top, 2 columns on desktop */
function assertCanon(): Fail | null {
  const a = document.getElementById("start-trial-hero");
  const b = document.getElementById("roi-calculator");
  const grid = document.getElementById("hero-roi-duo");
  if (!a || !b || !grid) return { reason: "Missing required nodes", meta: { hasStart:a!=null, hasROI:b!=null, hasGrid:grid!=null } };

  const desktop = matchMedia("(min-width:1025px)").matches;
  if (desktop) {
    const s = getComputedStyle(grid);
    // must be grid with 2 columns
    const isGrid = s.display === "grid";
    const cols = (s.gridTemplateColumns || "").split(" ").length;
    if (!isGrid || cols < 2) return { reason: "Grid must be 2 columns on desktop", meta: { display:s.display, gridTemplateColumns:s.gridTemplateColumns } };

    // centered tracks check: grid midpoint ≈ viewport midpoint
    const r = grid.getBoundingClientRect();
    const offset = Math.abs((r.left + r.right)/2 - (innerWidth/2));
    const ra = (a as HTMLElement).getBoundingClientRect();
    const rb = (b as HTMLElement).getBoundingClientRect();
    const topEqual = Math.abs(ra.top - rb.top) <= 2;
    const widthEqual = Math.abs(ra.width - rb.width) <= 4;

    if (offset > 4) return { reason: "Grid not centered under title", meta: { offsetPx: Math.round(offset) } };
    if (!topEqual || !widthEqual) return { reason: "Cards must share top (≤2px) and width (±4px)", meta: { ra, rb } };
  }
  return null;
}

export function startHeroDuoCanon() {
  ensureHeroDuoStructure();
  ensureHeroTitleGap();

  const fail = assertCanon();
  if (fail) blowUp(`${fail.reason}\n\n${JSON.stringify(fail.meta, null, 2)}`);

  // keep it healthy
  const mo = new MutationObserver(() => {
    ensureHeroDuoStructure();
    ensureHeroTitleGap();
    const f = assertCanon();
    if (f) blowUp(`${f.reason}\n\n${JSON.stringify(f.meta, null, 2)}`);
  });
  mo.observe(document.body, { childList: true, subtree: true });

  const ResizeObserver = (window as any).ResizeObserver;
  if (ResizeObserver) {
    const ro = new ResizeObserver(() => {
      const f = assertCanon();
      if (f) blowUp(`${f.reason}\n\n${JSON.stringify(f.meta, null, 2)}`);
    });
    ro.observe(document.documentElement);
  }
}
