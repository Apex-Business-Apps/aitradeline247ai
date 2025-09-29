# Hero Section Production Audit — Diagnosis

**Audit Date:** 2025-09-29  
**Scope:** Hero sections only (position, size, responsiveness)  
**Tools Used:** Console logs, network requests, session replay, code review

---

## Executive Summary

**Critical Issues Found:** 3  
**Medium Issues Found:** 4  
**Minor Issues Found:** 2

**Routes with Hero Sections:**
- `/` (Index) — HeroRoiDuo
- `/pricing` — Pricing Hero
- `/features` — Features Hero  
- `/faq` — FAQ Hero

---

## Issue Breakdown by Route

| Route | Issue | Severity | Impact |
|-------|-------|----------|--------|
| `/` (Index) | Logo uses fixed cm units for transform/sizing | CRITICAL | Breaks layout on small screens (<640px) |
| `/` (Index) | `hero-roi__grid` uses `margin-left: 1.8cm` | CRITICAL | Causes horizontal overflow and mis-centering |
| `/` (Index) | Grid columns use `minmax(420px, max-content)` | CRITICAL | Forces horizontal scroll on mobile |
| `/` (Index) | No safe area insets for PWA/mobile notches | MEDIUM | Content may be clipped by notches/home indicators |
| `/` (Index) | Fixed min-height values in rem | MEDIUM | Not responsive to viewport changes |
| `/pricing` | No safe area handling | MEDIUM | Content may overlap with mobile UI |
| `/features` | No safe area handling | MEDIUM | Content may overlap with mobile UI |
| `/faq` | No safe area handling | MEDIUM | Content may overlap with mobile UI |
| All routes | No explicit layout shift prevention | MINOR | Potential CLS during hero media load |
| All routes | Text sizing lacks fluid scaling | MINOR | Suboptimal readability on edge cases |

---

## Detailed Findings

### Route: `/` (Index — HeroRoiDuo)

**Issue 1: Logo Transform with Fixed Units**
- **Location:** `src/sections/HeroRoiDuo.tsx`, line 14-16
- **Problem:** Logo uses `transform: 'translateY(-0.5cm) scale(1.45) scaleY(1.3225) scaleX(1.3225)'`
- **Impact:** Fixed cm units don't scale on mobile, causing misalignment
- **Session Replay Evidence:** Viewport changes from 961px → 642px → 538px show layout breaking

**Issue 2: Grid Horizontal Offset**
- **Location:** `src/styles/hero-roi.css`, line 19
- **Problem:** `margin-left: 1.8cm` forces content off-center
- **Impact:** On narrow screens, this causes horizontal scroll and content clipping

**Issue 3: Fixed Grid Column Widths**
- **Location:** `src/styles/hero-roi.css`, line 14
- **Problem:** `grid-template-columns: repeat(2, minmax(420px, max-content))`
- **Impact:** On screens <840px, forces horizontal scroll instead of stacking

**Issue 4: No Safe Area Insets**
- **Location:** All hero sections
- **Problem:** No `padding: env(safe-area-inset-*)` declarations
- **Impact:** Content may be obscured by notches, home indicators in PWA/mobile

**Issue 5: Fixed Min-Heights**
- **Location:** `src/sections/HeroRoiDuo.tsx`, line 13
- **Problem:** `min-h-[10.9375rem] md:min-h-[14.0625rem]` uses fixed rem values
- **Impact:** Not responsive to actual logo aspect ratio or viewport

---

## Console Log Analysis

**Findings:**
- No hero-specific errors detected
- A/B test for `hero_cta_test` not found (defaulting to variant A)
- No JavaScript errors related to hero rendering

---

## Network Request Analysis

**Findings:**
- Hero logo (`official-logo.svg`) loaded successfully
- No CORS issues with hero assets
- Performance metrics show LCP of 5644ms (above 2500ms threshold) — hero media likely contributing

---

## Session Replay Analysis

**Key Observations:**
- Viewport resizing: 961px → 642px → 636px → 538px
- Significant layout shifts observed during resize
- Content clipping occurs at narrower viewports
- Mouse movement suggests user struggled with horizontal scrolling

---

## Next Steps

Proceed to `HERO_FIXES.md` for detailed remediation plan.
