function findInput(root:Element, selector:string){ return root.querySelector<HTMLInputElement>(selector); }

export function startKlaviyoAutoCapture(){
  const attach = () => {
    const root = document.getElementById("start-trial-hero"); if(!root) return;
    const form = root.querySelector("form"); if(!form) return;

    if ((form as any).__klBound) return; (form as any).__klBound = true;

    form.addEventListener("submit", () => {
      const email = findInput(form,'input[type="email"], input[name*="email" i]')?.value?.trim();
      const first = findInput(form,'input[name*="name" i]')?.value?.trim();
      const consent = !!findInput(form,'input[type="checkbox"]')?.checked;

      if (email && consent && window.klaviyo?.push) {
        window.klaviyo.push(["identify", {
          email,
          $first_name: first || undefined,
          $consent: ["email"],
          $source: "Start Trial",
          lead_source: "website"
        }]);
      }
    }, { once:true });
  };

  attach();
  const mo = new MutationObserver(attach);
  mo.observe(document.body, { subtree:true, childList:true });
}