// Tiny GA4 autotrack helpers (uses hard gtag snippet already on index.html)
declare global { interface Window { dataLayer?: any[]; gtag?: (...a:any[])=>void } }
function gtag(...args: any[]){ (window as any).gtag?.apply(window, args); }

// 1) PWA install
window.addEventListener("appinstalled", () => {
  gtag("event","install",{ method:"pwa", page_location: location.href });
});

// 2) Start Trial button clicks (in Start Trial hero)
function wireStartTrialClicks(){
  const root = document.getElementById("start-trial-hero"); if(!root) return;
  const btn = Array.from(root.querySelectorAll("button,input[type=submit],a")).find(el => /start\s+free\s+trial/i.test(el.textContent || ""));
  btn?.addEventListener("click", () => gtag("event","start_trial_click",{ section:"hero", page_location: location.href }), { once:true });
}

// 3) Start Trial form submit → SubmitLead
function wireStartTrialSubmit(){
  const root = document.getElementById("start-trial-hero"); if(!root) return;
  const form = root.querySelector("form"); if(!form) return;
  form.addEventListener("submit", () => {
    gtag("event","submit_lead",{
      form:"start_trial",
      page_location: location.href
    });
  }, { once:true });
}

// 4) ROI CTA buttons
function wireRoiCtas(){
  const root = document.getElementById("roi-calculator"); if(!root) return;
  const zero = Array.from(root.querySelectorAll("button,a")).find(el => /start\s+zero/i.test(el.textContent || ""));
  const pred = Array.from(root.querySelectorAll("button,a")).find(el => /choose\s+predictable/i.test(el.textContent || ""));
  zero?.addEventListener("click", () => gtag("event","pricing_start_zero",{ page_location: location.href }), { once:true });
  pred?.addEventListener("click", () => gtag("event","pricing_choose_predictable",{ page_location: location.href }), { once:true });
}

export function startGAAutotrack(){
  wireStartTrialClicks();
  wireStartTrialSubmit();
  wireRoiCtas();
  // re-wire if DOM shifts
  const mo = new MutationObserver(() => { wireStartTrialClicks(); wireStartTrialSubmit(); wireRoiCtas(); });
  mo.observe(document.body, { subtree:true, childList:true });
}