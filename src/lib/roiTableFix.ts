// Idempotent fixer: adds a <colgroup>, applies roles/classes, and rechecks on resize.
export function applyRoiTableCanon() {
  const root = document.getElementById("roi-calculator");
  if (!root) return;

  const tables = Array.from(root.querySelectorAll("table"));
  if (!tables.length) return;

  for (const t of tables) {
    // Add a <colgroup> with canonical widths once
    if (!t.querySelector("colgroup")) {
      const cg = document.createElement("colgroup");
      const c1 = document.createElement("col"); c1.className = "col-label";
      const c2 = document.createElement("col"); c2.className = "col-value";
      cg.appendChild(c1); cg.appendChild(c2);
      t.insertBefore(cg, t.firstChild);
    }
    // Add classes to cells for alignment (safe if re-run)
    t.querySelectorAll("td:first-child, th:first-child").forEach(el => el.classList.add("label"));
    t.querySelectorAll("td:last-child, th:last-child").forEach(el => el.classList.add("value"));
  }
}

// Keep it healthy if tooling mutates DOM
export function watchRoiTableCanon() {
  applyRoiTableCanon();
  const mo = new MutationObserver(() => applyRoiTableCanon());
  mo.observe(document.getElementById("roi-calculator") || document.body, { subtree: true, childList: true });
  const ro = (window as any).ResizeObserver ? new ResizeObserver(() => applyRoiTableCanon()) : null;
  ro?.observe(document.documentElement);
}

