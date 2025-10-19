# Hero Section Guardrails — PERMANENT PROTECTION

**Last Updated:** 2025-09-29  
**Purpose:** Prevent ANY future modifications from breaking hero sections  
**Status:** 🔒 ACTIVE & ENFORCED

---

## 🚨 CRITICAL: NEVER MODIFY WITHOUT APPROVAL

This document defines absolute rules for hero sections. Violations will trigger:
1. Runtime validation errors (visible in console)
2. Layout canon overlay (blocks UI in development)
3. Performance monitoring alerts
4. Failed automated checks

---

## Protected Files

### TIER 1: NEVER TOUCH (without explicit approval)

```
src/sections/HeroRoiDuo.tsx          — Primary hero component
src/styles/hero-roi.css              — Hero layout and responsive styles
src/lib/heroGuardian.ts              — Active monitoring system
src/lib/layoutCanon.ts               — Layout validation
src/lib/layoutGuard.ts               — Layout enforcement
```

**Why protected:** These files control hero structure, performance, and validation. Any change can break mobile/PWA compliance.

### TIER 2: MODIFY WITH CAUTION

```
src/pages/Pricing.tsx                — Hero section only (lines with safe-area-inset)
src/pages/Features.tsx               — Hero section only (lines with safe-area-inset)
src/pages/FAQ.tsx                    — Hero section only (lines with safe-area-inset)
src/components/sections/LeadCaptureCard.tsx  — Hero CTA
src/components/RoiCalculator.tsx     — Hero calculator
```

**Rules:**
- Never remove `env(safe-area-inset-*)` properties
- Never add fixed units (cm, mm, pt)
- Never change `data-node` attributes
- Test on mobile/PWA after any change

---

## Absolute Rules

### Rule 1: Brand Title MUST NOT CHANGE

```tsx
// ✅ CORRECT (locked)
<h1>Your 24/7 A<span className="text-primary">i</span> Receptionist</h1>
<p>Never miss a call. Work while you sleep.</p>

// ❌ FORBIDDEN (will fail validation)
<h1>Your AI Assistant</h1>
<p>We help businesses</p>
```

**Why:** Brand consistency is non-negotiable. Title is "TradeLine 24/7 — Your 24/7 Ai Receptionist!"

---

### Rule 2: Data-Node Attributes MUST EXIST

```tsx
// ✅ REQUIRED on index route (/)
<div data-node="grid" className="hero-roi__grid">
  <div data-node="ron" id="roi-calculator">...</div>
  <div data-node="start" id="start-trial-hero">...</div>
</div>

// ❌ FORBIDDEN (will trigger layout canon error)
<div className="hero-roi__grid">
  <div id="roi-calculator">...</div>
  <div id="start-trial-hero">...</div>
</div>
```

**Why:** Layout canon validation depends on these attributes. Missing = red overlay + console errors.

---

### Rule 3: Safe Area Insets REQUIRED

```tsx
// ✅ REQUIRED on ALL hero sections
<section style={{
  paddingTop: 'max(env(safe-area-inset-top, 0), 5rem)',
  paddingBottom: 'max(env(safe-area-inset-bottom, 0), 5rem)',
  paddingLeft: 'env(safe-area-inset-left, 0)',
  paddingRight: 'env(safe-area-inset-right, 0)'
}}>

// ❌ FORBIDDEN (hero will clip on notched devices)
<section className="py-20">
```

**Why:** Mobile/PWA compliance. Without these, heroes are cut off by notches/home indicators.

---

### Rule 4: NO FIXED UNITS IN HERO STYLES

```css
/* ❌ FORBIDDEN */
.hero {
  min-height: 10cm;
  margin-left: 1.8cm;
  font-size: 24pt;
}

/* ✅ REQUIRED */
.hero {
  min-height: clamp(20rem, 30vh, 40rem);
  margin-inline: auto;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
}
```

**Why:** Fixed units break responsive design. Use `clamp()`, `vw`, `vh`, `rem` only.

---

### Rule 5: Logo MUST Use Eager Loading + AspectRatio

```tsx
// ✅ REQUIRED (prevents LCP/CLS issues)
<img
  src={officialLogo}
  alt="TradeLine 24/7 Logo"
  loading="eager"
  style={{ aspectRatio: '1/1' }}
  className="w-full max-w-[200px] md:max-w-[280px]"
/>

// ❌ FORBIDDEN (causes 5s+ LCP)
<img
  src={officialLogo}
  alt="TradeLine 24/7 Logo"
  className="w-64"
/>
```

**Why:** Logo is LCP element on index route. `loading="eager"` + `aspectRatio` prevent performance regressions.

---

### Rule 6: Hero Grid MUST Be Responsive

```css
/* ✅ REQUIRED */
.hero-roi__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
  gap: clamp(1rem, 2vw, 2rem);
  margin-inline: auto;
}

/* ❌ FORBIDDEN (causes horizontal overflow) */
.hero-roi__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(420px, 1fr));
  margin-left: 1.8cm;
}
```

**Why:** `minmax(min(320px, 100%), 1fr)` prevents horizontal scrollbars on narrow screens.

---

### Rule 7: CTA Touch Targets ≥ 44x44px

```tsx
// ✅ REQUIRED (minimum size for mobile tapping)
<Button className="min-h-[44px] min-w-[44px] px-8 py-3">
  Grow Now
</Button>

// ❌ FORBIDDEN (too small for mobile)
<Button className="text-sm p-1">
  Grow Now
</Button>
```

**Why:** WCAG 2.1 AA requires 44x44px minimum touch targets. Smaller = failed accessibility.

---

### Rule 8: Performance Thresholds ENFORCED

```
Hero LCP: ≤ 2.5s (measured by heroGuardian.ts)
Hero CLS: ≤ 0.05 (measured by heroGuardian.ts)
```

**Violations logged to console:**
```
⚠️ HERO PERFORMANCE VIOLATION: LCP 3200ms exceeds threshold 2500ms on /
```

**How to check:**
```javascript
// Open browser console
console.log(window.__heroMetrics);
// See LCP/CLS for each route
```

---

## Active Monitoring Systems

### 1. Layout Canon Validator (`layoutCanon.ts`)

**Runs:** On page load + every DOM mutation  
**Checks:**
- Required IDs (`start-trial-hero`, `roi-calculator`)
- Grid structure (2 columns on desktop)
- Equal width/height for hero cards
- Data-node attributes present

**On Failure:**
- Red overlay blocks UI (development only)
- Error thrown in console
- Self-heal attempts via `layoutGuard.ts`

---

### 2. Hero Guardian (`heroGuardian.ts`)

**Runs:** On page load + every 5 seconds  
**Checks:**
- Performance metrics (LCP/CLS)
- Safe area insets present
- Logo optimization (eager loading, aspectRatio)
- CTA touch target sizes
- No forbidden units (cm, mm)

**On Failure:**
- Console errors with actionable messages
- Metrics logged to `window.__heroMetrics`

---

### 3. Mutation Observer (runtime)

**Watches:** All hero-related DOM changes  
**Triggers:** Re-validation if hero structure modified  
**Protection:** Catches accidental edits from other code

---

## How To Make APPROVED Changes

### Step 1: Check If Change Affects Heroes

```bash
# Search for hero-related code
grep -r "hero" src/sections/
grep -r "HeroRoiDuo" src/
grep -r "safe-area-inset" src/
```

### Step 2: If Yes, Follow This Process

1. **Read this document fully**
2. **Test locally in mobile viewport (375px width)**
3. **Test in PWA mode (install app)**
4. **Check console for hero validation errors**
5. **Run Lighthouse Mobile (ensure LCP ≤ 2.5s, CLS ≤ 0.05)**
6. **Test on physical device (iPhone/Android)**
7. **Verify all routes:** `/`, `/pricing`, `/features`, `/faq`

### Step 3: Validation Checklist

```
[ ] No fixed units (cm, mm, pt) added
[ ] Safe area insets preserved
[ ] Data-node attributes unchanged
[ ] Brand title unchanged
[ ] Logo optimization intact
[ ] CTA touch targets ≥ 44x44px
[ ] Grid responsive (no horizontal scroll)
[ ] Console shows no hero validation errors
[ ] LCP ≤ 2.5s (check window.__heroMetrics)
[ ] CLS ≤ 0.05 (check window.__heroMetrics)
[ ] Tested on mobile + PWA
```

---

## Emergency Rollback Procedure

If hero breaks in production:

### Option 1: Revert Via Git

```bash
git log --oneline -- src/sections/HeroRoiDuo.tsx
git checkout <last-good-commit> -- src/sections/HeroRoiDuo.tsx
git checkout <last-good-commit> -- src/styles/hero-roi.css
```

### Option 2: Revert Via Lovable

1. Open chat history
2. Find last hero-related edit
3. Click "Restore" button

### Option 3: Reference Backup

All working hero code is documented in:
- `HERO_FIXES.md` — Code snippets
- `PRODUCTION_CHECKLIST.md` — Final state

Copy code from these files to restore.

---

## Testing Commands

### Local Development

```bash
# Start dev server
npm run dev

# Open in mobile viewport (Chrome DevTools)
# 1. Open DevTools (F12)
# 2. Toggle device toolbar (Ctrl+Shift+M)
# 3. Select "iPhone 12 Pro" or "Galaxy S20"
# 4. Navigate to http://localhost:5173/

# Check console for hero validation
# Should see: "✅ Hero Guardian initialized on route: /"
```

### Performance Testing

```bash
# Run Lighthouse Mobile
npx lighthouse http://localhost:5173/ \
  --only-categories=performance \
  --emulated-form-factor=mobile \
  --throttling.cpuSlowdownMultiplier=4 \
  --output=json \
  --output-path=./lighthouse-hero.json

# Check LCP/CLS
jq '.audits["largest-contentful-paint"].numericValue, .audits["cumulative-layout-shift"].numericValue' lighthouse-hero.json
# Expected: < 2500, < 0.05
```

### Hero Metrics (Runtime)

```javascript
// Open browser console after page loads
setTimeout(() => {
  console.log('Hero Metrics:', window.__heroMetrics);
}, 6000);

// Expected output:
// [{
//   lcp: 2200,
//   cls: 0.03,
//   route: '/',
//   timestamp: 1738195200000
// }]
```

---

## What To Do If Validation Fails

### Error: "Missing required attribute: data-node"

**Fix:** Add data-node attributes to hero elements

```tsx
// In src/sections/HeroRoiDuo.tsx
<div className="hero-roi__grid" data-node="grid">
  <div id="roi-calculator" data-node="ron">...</div>
  <div id="start-trial-hero" data-node="start">...</div>
</div>
```

---

### Error: "Hero section uses forbidden fixed units (cm/mm)"

**Fix:** Replace with responsive units

```css
/* Before */
margin-left: 1.8cm;

/* After */
margin-inline: auto;
```

---

### Error: "Hero logo should use loading='eager'"

**Fix:** Add loading attribute

```tsx
<img
  src={officialLogo}
  loading="eager"
  style={{ aspectRatio: '1/1' }}
/>
```

---

### Error: "LCP 3200ms exceeds threshold 2500ms"

**Fix:** Optimize hero LCP element

1. Check if logo is LCP element
2. Ensure `loading="eager"` on logo
3. Preload logo in `<head>`:
   ```html
   <link rel="preload" as="image" href="/assets/official-logo.svg" />
   ```
4. Verify hero text uses web-safe fonts (no @font-face delays)

---

### Error: "CLS 0.12 exceeds threshold 0.05"

**Fix:** Reserve space for dynamic elements

1. Add `aspectRatio` to images
2. Set explicit width/height on containers
3. Use `min-height` on text elements:
   ```tsx
   <h1 style={{ minHeight: '120px' }}>...</h1>
   ```

---

## Contact & Escalation

**If you MUST modify hero code:**

1. Document reason in commit message
2. Run full validation checklist
3. Test on 3+ devices
4. Update this document with new rules if needed

**If validation fails and you can't fix:**

1. Check `HERO_FIXES.md` for reference code
2. Check `PRODUCTION_CHECKLIST.md` for requirements
3. Revert changes and ask for help
4. DO NOT deploy broken heroes to production

---

## Version History

| Date | Change | Author |
|------|--------|--------|
| 2025-09-29 | Initial guardrails + active monitoring | System |
| 2025-09-29 | Added performance thresholds | System |
| 2025-09-29 | Added validation rules | System |

---

## Summary: What This Protects

✅ **Mobile/PWA compliance** — Safe areas, no clipping  
✅ **Performance** — LCP ≤ 2.5s, CLS ≤ 0.05  
✅ **Brand consistency** — Title, logo, CTAs unchanged  
✅ **Responsive design** — No fixed units, fluid typography  
✅ **Accessibility** — Touch targets ≥ 44x44px  
✅ **Layout stability** — Data-node attributes, grid structure  

**Bottom line:** Follow these rules = heroes never break. Ignore them = runtime errors + failed deploys.

---

**🔒 THIS DOCUMENT IS PART OF THE PERMANENT SAFEGUARD SYSTEM. DO NOT DELETE.**

