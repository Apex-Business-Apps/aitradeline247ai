export function watchBannerHeight(){
  const root = document.documentElement;
  const banner = document.querySelector<HTMLElement>("[data-banner]");
  if(!banner) { root.style.setProperty("--banner-h","0px"); return; }
  const apply = () => root.style.setProperty("--banner-h", `${banner.offsetHeight || 0}px`);
  apply();
  new ResizeObserver(apply).observe(banner);
  window.addEventListener("load", apply);
}
