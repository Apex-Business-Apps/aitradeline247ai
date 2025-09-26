# DO NOT BREAK — Immutable Rules

## 🚫 NEVER TOUCH
- **Hero visuals & background:** No changes to `src/sections/HeroRoiDuo.tsx` layout structure or `src/assets/official-logo.svg`
- **Color tokens & grid system:** All colors MUST use semantic tokens from `src/index.css` and `tailwind.config.ts`
- **Hero/ROI Canon:** Files `src/styles/hero-roi.css`, `src/lib/layoutGuard.ts`, `src/components/HeroDuoCanon.tsx` are LOCKED
- **Layout guards:** `src/components/LayoutCanon.tsx` and `src/lib/layoutCanon.ts` provide runtime protection

## 🔒 SECURITY (CRITICAL)
- **Twilio signature validation:** MUST validate `X-Twilio-Signature` on ALL webhooks or return 403
- **Edge Functions:** `voice-answer` and `voice-status` security validation is mandatory
- **Database Functions:** All functions must use `SET search_path = public` for security
- **RLS Policies:** A/B test data restricted to admin-only access
- **Audit Logging:** Security events MUST be logged to analytics_events table

## 🍁 CANADA COMPLIANCE (LEGAL REQUIREMENT)
- **CASL consent copy:** Email signup requires explicit consent checkbox
- **PIPEDA notices:** Privacy notices must be present in call flows and data collection
- **Data hosting:** All data must remain in Canadian jurisdiction
- **Consent gating:** Klaviyo identify() only after explicit consent

## 📊 ANALYTICS (NO DUPLICATION)
- **GA4 ID:** `G-5KPE9X0NDM` - single instance only, no duplicate page_view events
- **Klaviyo snippet:** Load once only, consent-gated identify/track calls
- **Events:** `install`, `start_trial_click`, `submit_lead` marked as conversions

## 🔍 SEO (CANONICAL STRUCTURE)
- **Canonical URLs:** MUST point to `https://www.tradeline247ai.com{path}`
- **Sitemap:** `/sitemap.xml` must be maintained and referenced in robots.txt
- **Meta tags:** Title, description, OG/Twitter cards on every route
- **JSON-LD:** Organization and WebSite structured data required

## 📱 PWA (INSTALL PATTERN)
- **Manifest:** `/manifest.webmanifest` with proper icons and theme colors
- **Service Worker:** `/sw.js` minimal (install/activate/claim only)
- **Install prompt:** `beforeinstallprompt` capture and iOS Add to Home Screen helper
- **Icons:** 192x192, 512x512, and 512x512-maskable in `/assets/brand/App_Icons/`

## ⚡ PERFORMANCE (CORE WEB VITALS)
- **CLS target:** ≤ 0.01 (current implementation maintains this)
- **LCP element:** Hero logo with `fetchpriority="high"` and proper dimensions
- **Image optimization:** All images lazy loaded except above-fold hero elements
- **No blocking scripts:** All analytics and third-party scripts must be async/defer

## 🛡️ SECURITY HEADERS
- **CSP:** Content Security Policy implemented via meta tags
- **HSTS:** HTTP Strict Transport Security enabled
- **X-Content-Type-Options:** nosniff
- **X-Frame-Options:** DENY
- **X-XSS-Protection:** 1; mode=block
- **Referrer-Policy:** strict-origin-when-cross-origin