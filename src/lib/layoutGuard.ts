// LOVABLE-GUARD: runtime self-heal; hero code untouched.
export function enforceHeroRoiDuo() {
  const a = document.getElementById("start-trial-hero");
  const b = document.getElementById("roi-calculator");
  if (!a || !b) return;

  // ensure shared wrapper with canonical classes/attrs
  let wrapper = document.getElementById("hero-roi-duo");
  if (!wrapper) {
    wrapper = document.createElement("section");
    wrapper.id = "hero-roi-duo";
    wrapper.className = "hero-roi__grid";
    wrapper.setAttribute("data-lock", "true");
    const first = (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? a : b;
    first.parentElement?.insertBefore(wrapper, first);
  }
  if (a.parentElement !== wrapper) wrapper.appendChild(a);
  if (b.parentElement !== wrapper) wrapper.appendChild(b);

  // outer container for max-width + padding if missing
  if (!wrapper.parentElement?.classList.contains("hero-roi__container")) {
    const container = document.createElement("div");
    container.className = "hero-roi__container";
    wrapper.parentElement?.insertBefore(container, wrapper);
    container.appendChild(wrapper);
  }
}