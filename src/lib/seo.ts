// Minimal, dependency-free SEO manager for a Vite SPA.
type SEO = { title?: string; description?: string; path?: string };

const BASE = "https://www.tradeline247ai.com";

function setAttr(sel: string, attr: string, val: string) {
  const el = document.querySelector<HTMLElement>(sel);
  if (el) el.setAttribute(attr, val);
}

export function setSEO({ title, description, path = "/" }: SEO) {
  const url = new URL(path, BASE).toString();

  if (title) document.title = title;

  if (description) {
    setAttr('meta[data-seo-meta]', 'content', description);
    setAttr('meta[data-seo-og-desc]', 'content', description);
    setAttr('meta[data-seo-tw-desc]', 'content', description);
  }

  // Canonical + OG URL
  setAttr('link[data-seo-canon]', 'href', url);
  setAttr('meta[data-seo-og-url]', 'content', url);

  // Titles (keep consistent)
  if (title) {
    setAttr('meta[data-seo-og-title]', 'content', title);
    setAttr('meta[data-seo-tw-title]', 'content', title);
  }
}
