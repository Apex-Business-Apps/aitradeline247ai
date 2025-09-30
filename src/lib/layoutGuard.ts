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
    wrapper.setAttribute("data-lovable-lock", "permanent");
    const first = (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? a : b;
    first.parentElement?.insertBefore(wrapper, first);
  }
  if (a.parentElement !== wrapper) wrapper.appendChild(a);
  if (b.parentElement !== wrapper) wrapper.appendChild(b);

  // outer container for max-width + padding if missing
  if (!wrapper.parentElement?.classList.contains("hero-roi__container")) {
    const container = document.createElement("div");
    container.className = "hero-roi__container";
    container.setAttribute("data-lovable-lock", "permanent");
    wrapper.parentElement?.insertBefore(container, wrapper);
    container.appendChild(wrapper);
  }

  // Lock individual hero elements permanently
  a.setAttribute("data-lovable-lock", "permanent");
  b.setAttribute("data-lovable-lock", "permanent");
  
  // Enforce portrait mode centering
  const isPortrait = window.innerHeight > window.innerWidth;
  if (isPortrait) {
    a.style.transform = "none";
    b.style.transform = "none";
    a.style.margin = "0 auto";
    b.style.margin = "0 auto";
  }
}

// Enhanced locking with mutation resistance
export function lockHeroElementsPermanently() {
  const elements = [
    document.getElementById("start-trial-hero"),
    document.getElementById("roi-calculator"),
    document.getElementById("hero-roi-duo"),
    document.querySelector(".hero-roi__container")
  ].filter(Boolean);

  elements.forEach(el => {
    if (el) {
      el.setAttribute("data-lovable-lock", "permanent");
      el.setAttribute("data-layout-lock", "true");
      // Freeze the element's style modifications
      Object.defineProperty(el, 'style', {
        configurable: false,
        enumerable: true,
        get: () => el.getAttribute('style'),
        set: () => console.warn('Hero element style modification blocked by layout guardian')
      });
    }
  });
}