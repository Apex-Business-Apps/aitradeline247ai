# 🔒 HERO LAYOUT - PERMANENTLY LOCKED 🔒

**Status**: LOCKED FOR LIFE  
**Date Locked**: September 29, 2025  
**Reference Screenshot**: `Screenshot_20250929_193502_Chrome.jpg`

---

## ⚠️ CRITICAL WARNING ⚠️

**THIS LAYOUT IS PERMANENTLY LOCKED. DO NOT MODIFY WITHOUT EXECUTIVE APPROVAL.**

Any modifications to this layout require:
1. ✅ Written executive approval
2. ✅ Full mobile & desktop regression testing
3. ✅ Performance validation (LCP, CLS)
4. ✅ Mobile/PWA compliance verification
5. ✅ Accessibility audit

---

## 📐 APPROVED LAYOUT SPECIFICATIONS

### Mobile Layout (< 1024px)
- **Column Count**: Single column
- **Alignment**: Everything centered
- **Logo**: 
  - Max-width: 322px
  - Centered horizontally
  - aspect-ratio: 1/1
- **Headings & Text**: All center-aligned
- **Form Container**:
  - Max-width: 600px
  - Centered with `margin: 0 auto`
  - NO horizontal offset (`transform: none`)
- **ROI Calculator**: Hidden or stacked below form

### Desktop Layout (≥ 1024px)
- **Column Count**: Two equal columns (grid)
- **Grid Configuration**:
  - `grid-template-columns: repeat(2, minmax(500px, 650px))`
  - Max-width: 1800px
  - Gap: 4rem
  - Centered with `justify-content: center`
- **Columns**:
  - Both max-width: 650px
  - Equal top alignment
  - Horizontal offset: `translateX(1.35cm)` for visual balance
- **Elements**:
  - Left: ROI Calculator (`#roi-calculator`)
  - Right: Lead Capture Form (`#start-trial-hero`)

---

## 🛡️ PROTECTION MECHANISMS

### Active Monitoring Systems
1. **layoutCanon.ts** - Validates layout structure on load & mutations
2. **layoutGuard.ts** - Self-heals layout if structure breaks
3. **heroGuardian.ts** - Monitors performance & data attributes
4. **MutationObserver** - Watches for unauthorized DOM changes

### Protected CSS Rules
All critical CSS rules use `!important` flags to prevent overrides:
- Container positioning
- Grid configuration
- Column widths
- Transform offsets
- Responsive breakpoints

### Data Attributes
All protected elements have `data-lovable-lock="true"`:
- `#hero-h1` - Main heading
- `#start-trial-hero` - Lead capture form container
- `#roi-calculator` - ROI calculator container
- `.hero-roi__grid` - Grid wrapper
- `.hero-roi__container` - Outer container

---

## 🚨 VIOLATION CONSEQUENCES

If layout is modified without approval:
- ❌ Console errors will be logged
- ❌ Visual overlay warning will appear
- ❌ Layout canon validation will fail
- ❌ Deployment may be blocked
- ❌ Performance metrics may degrade

---

## 📋 TESTING CHECKLIST

Before ANY layout changes (if approved):
- [ ] Test on mobile (375px - 768px widths)
- [ ] Test on tablet (768px - 1024px widths)
- [ ] Test on desktop (1024px+ widths)
- [ ] Verify perfect centering on mobile
- [ ] Verify equal column widths on desktop
- [ ] Verify no horizontal scroll on any viewport
- [ ] Run Lighthouse performance audit (LCP ≤ 2.5s, CLS ≤ 0.05)
- [ ] Test PWA safe area insets
- [ ] Verify keyboard navigation
- [ ] Check touch target sizes (≥ 44x44px)
- [ ] Validate with layoutCanon.ts (no console errors)

---

## 📁 PROTECTED FILES

**Tier 1 - Never Touch Without Approval:**
- `src/styles/hero-roi.css` - Layout styles
- `src/sections/HeroRoiDuo.tsx` - Hero component
- `src/lib/layoutCanon.ts` - Layout validator
- `src/lib/layoutGuard.ts` - Self-healing logic

**Tier 2 - Modify with Extreme Caution:**
- `src/components/sections/LeadCaptureCard.tsx`
- `src/components/RoiCalculator.tsx`
- `src/lib/heroGuardian.ts`

---

## 🔄 ROLLBACK PROCEDURES

If layout breaks:

### Option 1: Git Revert
```bash
git log --oneline -- src/styles/hero-roi.css
git revert <commit-hash>
```

### Option 2: Restore from Lovable
- Go to project history
- Find last working version
- Click "Revert to this version"

### Option 3: Emergency CSS Override
Add to `src/index.css`:
```css
/* EMERGENCY LAYOUT RESTORE */
@import url('./styles/hero-roi.css');
```

---

## 📞 SUPPORT

If you need to modify this layout:
1. Document the business reason
2. Get executive sign-off
3. Create a backup branch
4. Test exhaustively
5. Update this documentation

**Questions?** Contact the development team lead before making changes.

---

**Remember: This layout is locked because it's proven to work perfectly on all devices. Breaking it creates user experience issues and potential business impact.**
