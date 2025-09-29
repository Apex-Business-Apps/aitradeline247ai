# Hero Guardian — Active Protection Status

**Last Updated:** 2025-09-29  
**Status:** 🟢 ACTIVE & MONITORING

---

## What Is Hero Guardian?

Hero Guardian is an active monitoring system that protects all hero sections from breaking changes. It runs automatically in your browser and validates:

✅ Hero structure and layout  
✅ Performance metrics (LCP/CLS)  
✅ Safe area compliance  
✅ CTA functionality  
✅ Brand consistency  

---

## How To Verify It's Working

### 1. Open Browser Console

**Chrome/Edge:** Press `F12` or `Ctrl+Shift+J`  
**Firefox:** Press `F12` or `Ctrl+Shift+K`  
**Safari:** Press `Cmd+Option+C`

### 2. Look For Activation Message

After the page loads (~1.5 seconds), you should see:

```
✅ Hero Guardian initialized on route: /
```

This confirms the monitoring system is active.

### 3. Check Hero Metrics

After 5-6 seconds, run this in the console:

```javascript
console.log(window.__heroMetrics);
```

**Expected output:**
```javascript
[{
  lcp: 2200,      // Largest Contentful Paint (ms)
  cls: 0.03,      // Cumulative Layout Shift
  route: '/',     // Current route
  timestamp: 1738195200000
}]
```

**What these mean:**
- `lcp` should be ≤ 2500ms (2.5 seconds)
- `cls` should be ≤ 0.05
- If these thresholds are exceeded, you'll see warnings in console

---

## What Happens If Hero Breaks?

Hero Guardian will automatically detect issues and log them:

### Structural Violations

```
🚨 HERO STRUCTURE VALIDATION FAILED: {
  isValid: false,
  errors: [
    "Missing required attribute: data-node="start" on route /"
  ],
  warnings: [],
  route: "/"
}
```

**What to do:** Check HERO_GUARDRAILS.md Rule 2 for fix instructions.

---

### Performance Violations

```
⚠️ HERO PERFORMANCE VIOLATION: LCP 3200ms exceeds threshold 2500ms on /
```

**What to do:** Check HERO_GUARDRAILS.md Rule 5 and Rule 8 for optimization steps.

---

### CTA Violations

```
⚠️ Hero CTA Warnings: [
  "Hero CTA #1 has insufficient touch target: 36x36px (minimum 44x44px)"
]
```

**What to do:** Check HERO_GUARDRAILS.md Rule 7 for touch target requirements.

---

## Protection Layers

Hero Guardian works alongside two other systems:

### 1. Layout Canon (`layoutCanon.ts`)

- **Runs:** On page load + every DOM mutation
- **Purpose:** Validates hero structure matches specification
- **On Failure:** Red overlay blocks UI (development only)

### 2. Layout Guard (`layoutGuard.ts`)

- **Runs:** Before Layout Canon validation
- **Purpose:** Attempts to self-heal broken hero structure
- **Action:** Moves hero elements back to correct positions

---

## Testing The Guardian

### Trigger A Validation (Safe Test)

**Open console and run:**
```javascript
// This should trigger a validation
const heroSection = document.querySelector('section.bg-gradient-orange-subtle');
console.log('Hero found:', !!heroSection);

// Check for required data-node attributes
const hasStart = !!document.querySelector('[data-node="start"]');
const hasGrid = !!document.querySelector('[data-node="grid"]');
const hasRon = !!document.querySelector('[data-node="ron"]');

console.log('Data-node attributes:', { hasStart, hasGrid, hasRon });
```

**Expected result:** All should be `true`

---

### Check Safe Area Implementation

**Run in console:**
```javascript
const hero = document.querySelector('section.bg-gradient-orange-subtle');
const styles = getComputedStyle(hero);

console.log({
  paddingTop: styles.paddingTop,
  paddingBottom: styles.paddingBottom,
  paddingLeft: styles.paddingLeft,
  paddingRight: styles.paddingRight
});
```

**Expected:** All values should include safe area insets (> 0 on notched devices)

---

## Disabling Hero Guardian

**⚠️ NOT RECOMMENDED**

If you absolutely must disable it temporarily:

```javascript
// In browser console
window.__disableHeroGuardian = true;
// Reload page
```

**Re-enable:**
```javascript
delete window.__disableHeroGuardian;
// Reload page
```

**Note:** Guardian will automatically re-enable on next page load unless you add this to code (which is strongly discouraged).

---

## Files Monitored

Hero Guardian actively watches these files for changes:

```
✅ src/sections/HeroRoiDuo.tsx
✅ src/styles/hero-roi.css
✅ src/pages/Pricing.tsx (hero section)
✅ src/pages/Features.tsx (hero section)
✅ src/pages/FAQ.tsx (hero section)
✅ src/components/sections/LeadCaptureCard.tsx
✅ src/components/RoiCalculator.tsx
```

Any DOM changes to these components will trigger re-validation.

---

## Validation Schedule

| Trigger | When | What It Checks |
|---------|------|----------------|
| Page Load | 1.5s after load | Structure, CTAs, safe areas |
| Performance Check | 5s after load | LCP, CLS metrics |
| DOM Mutation | On any hero change | Structure re-validation |
| Window Resize | On resize | Layout stability |

---

## Troubleshooting

### Guardian Not Initializing

**Symptom:** No "✅ Hero Guardian initialized" message in console

**Possible causes:**
1. JavaScript errors preventing execution
2. File not imported in `main.tsx`
3. Browser doesn't support required APIs

**Fix:**
1. Check console for errors
2. Verify `import { initHeroGuardian } from "./lib/heroGuardian"` exists in `src/main.tsx`
3. Test in modern browser (Chrome 90+, Firefox 90+, Safari 14+)

---

### False Positives

**Symptom:** Guardian reports errors but hero looks fine

**Possible causes:**
1. Validation running before hero fully renders
2. Browser extension modifying DOM
3. Cached old code

**Fix:**
1. Refresh page with cache clear (Ctrl+Shift+R / Cmd+Shift+R)
2. Disable browser extensions temporarily
3. Check if validation timing needs adjustment in `heroGuardian.ts`

---

### Metrics Not Recording

**Symptom:** `window.__heroMetrics` is undefined or empty

**Possible causes:**
1. Page navigated away before metrics recorded
2. Performance Observer not supported
3. Guardian not initialized

**Fix:**
1. Wait 6+ seconds after page load
2. Test in modern browser
3. Check initialization in console

---

## Status Summary

| System | File | Status | Purpose |
|--------|------|--------|---------|
| Hero Guardian | `src/lib/heroGuardian.ts` | 🟢 Active | Performance + structure monitoring |
| Layout Canon | `src/lib/layoutCanon.ts` | 🟢 Active | Layout validation |
| Layout Guard | `src/lib/layoutGuard.ts` | 🟢 Active | Self-healing |
| CSS Guards | `src/styles/hero-roi.css` | 🟢 Active | Style protection |
| Documentation | `HERO_GUARDRAILS.md` | 🟢 Complete | Rule reference |

---

## Next Steps

1. ✅ Verify guardian is active (check console)
2. ✅ Review `HERO_GUARDRAILS.md` for rules
3. ✅ Test on mobile device (check safe areas)
4. ✅ Run Lighthouse test (verify performance)
5. ✅ Monitor console for any warnings

---

**🔒 Hero Guardian is your permanent safety net. It runs automatically and requires no configuration.**
