# Sequential Tasks (for our colleague)

## 0) Read Canon First (no changes)
**Prompt:** "Open `docs/canon/PROJECT_CANON.md` and `DO_NOT_BREAK.md`. Confirm understanding of all immutable rules including hero layout canon, Canadian compliance, and security requirements. Do not modify any code."

## 1) A11y 100 Finisher (skip link + auto labels)
**Prompt:** "Add skip navigation link to `src/components/layout/Header.tsx` and ensure all form inputs have proper ARIA labels. Focus: keyboard navigation, screen reader compatibility, and WCAG AA compliance. Test with tab navigation through entire app."

**Files to modify:** 
- `src/components/layout/Header.tsx`
- `src/components/sections/LeadCaptureForm.tsx` 
- `src/components/RoiCalculator.tsx`

## 2) Per-route OG Images
**Prompt:** "Create route-specific Open Graph images (1200×630) and store in `public/assets/brand/og/`. Generate images for: homepage (`home-og.png`), features (`features-og.png`), pricing (`pricing-og.png`), contact (`contact-og.png`). Update `src/components/seo/SEOHead.tsx` to dynamically select OG image based on route. Maintain fallback to existing `/og-image.jpg`."

**Files to create:**
- `public/assets/brand/og/home-og.png`
- `public/assets/brand/og/features-og.png` 
- `public/assets/brand/og/pricing-og.png`
- `public/assets/brand/og/contact-og.png`

**Files to modify:**
- `src/components/seo/SEOHead.tsx`

## 3) GSC Finalization (manual)
**Prompt:** "Manual task - No code changes. In Google Search Console for https://www.tradeline247ai.com: 1) Submit/refresh `/sitemap.xml` in Sitemaps section, 2) Use URL Inspection tool on homepage and request indexing, 3) Review Coverage report and document any warnings that need developer fixes."

**Action:** Manual GSC configuration only

## 4) Asset Cache Validation
**Prompt:** "Verify asset caching headers are properly configured. Test that static assets have appropriate cache-control headers and that asset versioning is working for browser cache busting. No CDN cache purging needed."

**Action:** Cache header verification only

## 5) Guardrails QA Implementation
**Prompt:** "Create comprehensive guardrails QA page at `src/pages/qa/Guardrails.tsx` that tests for potential security issues: jailbreak attempts, injection attacks, malware detection. All tests should return **BLOCKED** status. Include tests for: SQL injection patterns, XSS attempts, path traversal, CSRF protection, and Twilio signature validation."

**Files to create:**
- `src/pages/qa/Guardrails.tsx`

**Files to modify:**
- `src/App.tsx` (add route)

## 6) Hero Layout Canon Enforcement
**Prompt:** "Verify hero layout canon implementation. Ensure `src/lib/layoutGuard.ts` enforces proper Hero/ROI duo structure. Test that `src/components/HeroDuoCanon.tsx` and `src/components/LayoutCanon.tsx` are properly mounted. Verify CSS grid in `src/styles/hero-roi.css` maintains equal columns/heights. Run layout guard and confirm no red overlay appears."

**Files to verify (NO CHANGES):**
- `src/sections/HeroRoiDuo.tsx`
- `src/styles/hero-roi.css`
- `src/lib/layoutGuard.ts`
- `src/components/HeroDuoCanon.tsx`

## 7) Canadian Compliance Audit
**Prompt:** "Audit all user-facing copy for Canadian compliance. Verify CASL consent language in `src/components/sections/LeadCaptureForm.tsx` is explicit and compliant. Ensure PIPEDA privacy notices are present in call flows. Check that Klaviyo consent gating in `src/lib/klaviyo.ts` only triggers after checkbox consent."

**Files to review:**
- `src/components/sections/LeadCaptureForm.tsx`
- `src/lib/klaviyo.ts`
- `src/pages/Privacy.tsx`
- `supabase/functions/voice-answer/index.ts`

## 8) Security Headers Validation
**Prompt:** "Test that security headers are properly implemented. Verify CSP, HSTS, and other security headers are present in browser dev tools. Ensure `src/components/security/SecurityMonitor.tsx` is properly mounted and functioning. Test that Twilio webhook endpoints return 403 for invalid signatures using `scripts/twilio_negative_test.sh`."

**Files to verify:**
- `src/components/security/SecurityMonitor.tsx`
- `scripts/twilio_negative_test.sh`
- Network tab security headers

## 9) Analytics Deduplication Check  
**Prompt:** "Verify GA4 implementation has no duplicate events. Check that `G-5KPE9X0NDM` appears only once in the app. Test Klaviyo integration only fires after consent. Verify conversion events (`install`, `start_trial_click`, `submit_lead`) are properly configured as per `docs/ga4-audiences.md`."

**Files to verify:**
- GA4 implementation in codebase
- Klaviyo snippet implementation
- Analytics event firing

## 10) PWA Installation Flow Test
**Prompt:** "Test complete PWA installation flow. Verify `beforeinstallprompt` is captured correctly, install banner appears on supported devices, and iOS Add to Home Screen helper works. Check that `/manifest.webmanifest` is valid and all icon sizes are accessible. Test offline functionality with minimal service worker."

**Files to verify:**
- `/manifest.webmanifest` 
- `/sw.js`
- PWA install prompt components