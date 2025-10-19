# Apple Icon Workflow (APPLE•0 to APPLE•7)

## Overview
This document describes the complete, idempotent workflow for generating, validating, and deploying iOS AppIcon assets for TradeLine 24/7.

---

## APPLE•0 — Global Guardrails

**ABSOLUTE RULE:** Do NOT change, move, or generate ANY UI/UX (layouts, routes, copy, colors). Assets & build scripts only.

### Inputs
- Master logo: `public/assets/brand/icon_master.svg` (normalized 1024×1024, sRGB, no alpha)

### Idempotency
- If generated icons already exist with identical SHA256 hashes, scripts SKIP and print "no-op"
- If any step would modify non-asset files, scripts ABORT

---

## APPLE•1 — Validate the SVG (One-Time)

**Goal:** Ensure the master SVG is App Store–safe.

### Tasks
1. Open `public/assets/brand/icon_master.svg` and confirm:
   - ViewBox is square (1024×1024)
   - All text converted to outlines; no external fonts
   - Color profile sRGB; no embedded raster > 1px
   - No background/rounded corners/alpha mask (Apple applies mask)

2. If `src/assets/official-logo.svg` needs normalization, run manual conversion to create `icon_master.svg`

### Output
- Normalized master SVG at `public/assets/brand/icon_master.svg`
- ViewBox: `0 0 1024 1024`
- SHA256 checksum logged

---

## APPLE•2 — Add Generator (Repeatable Script)

**Goal:** Deterministically generate the full iOS AppIcon set from SVG.

### Package Dependencies
```json
{
  "devDependencies": {
    "sharp": "^0.33.2"
  },
  "scripts": {
    "gen:ios-icons": "node scripts/gen-ios-icons.mjs",
    "validate:ios-icons": "node scripts/validate-ios-icons.mjs",
    "prebuild:ios": "npm run gen:ios-icons"
  }
}
```

### Generator Script
**File:** `scripts/gen-ios-icons.mjs`

**Features:**
- Uses `sharp` to rasterize master SVG to required PNG sizes
- Strips alpha for 1024 marketing icon only
- Emits all sizes to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- SHA256 hash checks for idempotency (skip if identical)
- Outputs table of filenames, dimensions, bytes, SHA256

**iOS AppIcon Sizes:**
- 1024 (marketing, no alpha)
- 180, 120, 167, 152, 76, 60, 40, 29
- Plus @2x/@3x variants for 60, 40, 29

### Usage
```bash
npm ci
npm run gen:ios-icons
```

---

## APPLE•3 — Correct Contents.json (Drop-In)

**Goal:** Accurate asset catalog metadata.

**File:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json`

**Format:**
```json
{
  "images": [
    { "idiom": "iphone", "size": "60x60", "scale": "2x", "filename": "icon-120.png" },
    { "idiom": "iphone", "size": "60x60", "scale": "3x", "filename": "icon-180.png" },
    ...
    { "idiom": "ios-marketing", "size": "1024x1024", "scale": "1x", "filename": "icon-1024.png" }
  ],
  "info": { "version": 1, "author": "xcode" }
}
```

**Note:** Filenames MUST match generator outputs.

---

## APPLE•4 — Replace Assets Safely (No UI Impact)

**Goal:** Clean swap without residue.

### Steps
1. Delete everything under `ios/App/App/Assets.xcassets/AppIcon.appiconset/*` EXCEPT `Contents.json`
2. Run: `npm ci && npm run gen:ios-icons`
3. In Xcode → TARGETS → General → App Icons: ensure "AppIcon" is selected
4. Product → Clean Build Folder; then build for simulator (iPhone 15 Pro) to verify

### Idempotency
Re-running leaves identical files untouched (SHA256 hash check).

---

## APPLE•5 — Validation (Pre-Submit Gate)

**Goal:** Guarantee Apple compliance.

### Automated Checks
**File:** `scripts/validate-ios-icons.mjs`

**Usage:**
```bash
npm run validate:ios-icons
```

**Validation Criteria:**
- `icon-1024.png`: PNG, sRGB, 1024×1024, NO alpha (**CRITICAL**)
- All other icons: PNG, correct sizes, sRGB
- Format validation via sharp metadata
- Color space verification

**Output:**
- Table of filenames and validation status
- ✅ PASS / ❌ FAIL with error details
- Exit code 0 (pass) or 1 (fail)

### Manual Checks
- Visual pixel density: open 400% in Xcode Asset Catalog → no aliasing
- Marketing icon artwork matches bundle icon artwork (no mismatch)

---

## APPLE•6 — CI Hook (Prevent Regressions)

**Goal:** Never ship blurry icons again.

**File:** `.github/workflows/ios-icon-validation.yml`

**Triggers:**
- Push to main/master
- PR changes to:
  - `public/assets/brand/icon_master.svg`
  - `scripts/gen-ios-icons.mjs`
  - `ios/App/App/Assets.xcassets/AppIcon.appiconset/**`

**CI Steps:**
1. Install dependencies
2. Run `npm run gen:ios-icons`
3. Run `npm run validate:ios-icons`
4. Check `icon-1024.png` SHA256 baseline (future: compare against stored baseline)
5. Verify no alpha in marketing icon
6. Fail CI if any validation fails

**Optional Pre-Build Hook:**
```json
"scripts": {
  "prebuild:ios": "npm run gen:ios-icons"
}
```
Auto-regenerates icons before iOS builds locally.

---

## APPLE•7 — Store Upload Checklist (Final)

**Goal:** Smooth App Store Connect upload.

### Pre-Upload
- [ ] Archive in Xcode → Validate → Upload
- [ ] Ensure App Store Icon (1024, no alpha) is present in App Store Connect
- [ ] Screenshots and marketing assets use the SAME glyph (no gradient background)
- [ ] Run `npm run validate:ios-icons` locally (must pass)
- [ ] Verify CI passes on latest commit

### Common Rejections
- **"Icon has alpha"** → Re-run `npm run gen:ios-icons` (ensures 1024 has no alpha)
- **"Icon not exactly 1024"** → Check validation script output
- **"Icon is blurry"** → Ensure master SVG is vector at 1024×1024

### Post-Upload
- Monitor App Store Connect for review status
- If rejected, check:
  1. Validation script output
  2. SHA256 of icon-1024.png
  3. Xcode Asset Catalog visual inspection

---

## Emergency Rollback

If icons are broken post-deployment:

1. **Revert to last known good commit:**
   ```bash
   git revert <commit-hash>
   ```

2. **Re-generate icons:**
   ```bash
   npm run gen:ios-icons
   npm run validate:ios-icons
   ```

3. **Re-upload to App Store Connect**

---

## File Manifest

### Assets
- `public/assets/brand/icon_master.svg` — Normalized 1024×1024 master icon
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` — Generated PNG icons

### Scripts
- `scripts/gen-ios-icons.mjs` — Icon generator (idempotent)
- `scripts/validate-ios-icons.mjs` — Icon validator (pre-submit gate)

### Config
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` — Asset catalog metadata

### CI/CD
- `.github/workflows/ios-icon-validation.yml` — Automated validation on push/PR

---

## SHA256 Baseline (Future)

For CI baseline comparison, store the current SHA256 of `icon-1024.png`:

```bash
shasum -a 256 ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png
```

Store in `.github/workflows/icon-baseline.txt` or as CI secret for comparison.

---

## Troubleshooting

### "Icon has alpha" rejection
**Fix:** Re-run `npm run gen:ios-icons` (ensures marketing icon strips alpha)

### "Blurry icons"
**Fix:** Ensure `icon_master.svg` is vector at 1024×1024 (not raster upscale)

### "Wrong dimensions"
**Fix:** Check validation script output; regenerate with `npm run gen:ios-icons`

### Generator fails
**Fix:** Check `sharp` dependency installed: `npm ci`

---

## Maintenance

### Updating Master Icon
1. Update `public/assets/brand/icon_master.svg`
2. Ensure ViewBox is `0 0 1024 1024`
3. Run `npm run gen:ios-icons`
4. Run `npm run validate:ios-icons`
5. Commit changes (CI will validate)

### Adding New Sizes
1. Update `scripts/gen-ios-icons.mjs` sizes array
2. Update `Contents.json` with new entries
3. Re-run generator and validator
4. Test in Xcode

---

## References

- [Apple Human Interface Guidelines — App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Xcode Asset Catalog Format Reference](https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

---

**Last Updated:** 2025-10-14  
**Maintained By:** DevOps SRE Team

