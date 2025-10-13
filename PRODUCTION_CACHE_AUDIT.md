# Production Cache & Serving Audit + Fixes

**Date**: 2025-10-13  
**Scope**: Backend/build/serving infrastructure ONLY (zero UI/UX changes)  
**Objective**: Eliminate .js→HTML misserves, stale SW, and boot failures

---

## LEARN: Evidence Captured

### L-1: Current Asset Serving Architecture

**index.html References** (development):
```html
<script type="module" src="/src/main.tsx"></script>
```

**Production Build** (after `npm run build`):
- Vite outputs: `dist/index.html` + `dist/assets/*.{js,css}` (content-hashed)
- Example: `/assets/index-Bl7vYSN2.js`, `/assets/index-CxY8KlPq.css`

**Current server.mjs Static Serving Order**:
```javascript
// Line 63-72: Static middleware BEFORE catch-all ✅
app.use(express.static(distDir, { index: false, maxAge: '1y', ... }));

// Line 74-77: /assets mount (redundant but safe)
app.use('/assets', express.static(..., { maxAge: '1y' }));

// Line 84-92: SPA catch-all LAST ✅
app.get('*', (req, res) => res.sendFile(indexPath));
```

**Status**: Order is CORRECT. Assets served before catch-all.

**Cache-Control Headers**:
- `/assets/*`: `maxAge: '1y'` → immutable ✅
- `index.html`: Special handler sets `Cache-Control: no-cache` ✅ (line 68-70)
- `/sw.js`: **MISSING** explicit `no-cache` ❌

**Potential Issue**: Service worker script (`/sw.js`) not explicitly set to `no-cache`.

### L-2: Service Worker Cache Strategy (public/sw.js)

**Current Logic** (v5):
- **Static assets** (.js/.css): Cache-first with 7-day TTL ✅
- **index.html**: Network-only (line 144) ✅
- **SW script itself**: Needs `Cache-Control: no-cache` from server ❌

**Risk**: Browser may cache SW script itself, delaying updates.

### L-3: Console Error Evidence

From live preview logs:
```
Error: Minified React error #310
```
This is a **React hydration/rendering error**, NOT an asset serving issue. Separate from cache problems.

**Root Cause**: Component rendering issue (likely in a dashboard component using `useEffect`).  
**Out of Scope**: UI/component fix needed separately.

### L-4: Asset MIME Type Verification

**Manual Check Needed** (production build):
1. Build app: `npm run build`
2. Serve: `npm run preview` or `node server.mjs`
3. Verify:
   - `curl -I http://localhost:3000/` → `Content-Type: text/html`
   - `curl -I http://localhost:3000/assets/index-*.js` → `Content-Type: application/javascript`
   - `curl -I http://localhost:3000/sw.js` → `Cache-Control: no-cache`

**Expected**: All assets return correct MIME types (no .js → text/html).

---

## PLAN: Permanent Fixes

### P-1: Server Cache Headers ✅ (Already Correct)
- Static assets: `max-age=31536000, immutable`
- index.html: `no-cache`
- **ADD**: `/sw.js` explicit `no-cache`

### P-2: Service Worker Safety Net ✅ (Already Has)
- `skipWaiting()` + `clients.claim()` ✅
- Never cache index.html long-term ✅
- Cache version stamping ✅

### P-3: Build Verification (NEW)
- **Add**: Post-build script to validate all assets exist
- **Add**: MIME type check in dist/

### P-4: Atomic Release Discipline (DOCUMENTED)
- Assets first, then index.html
- Keep previous N releases

### P-5: Boot Sentinel (NEW)
- Add silent 3s post-load check
- Log telemetry if app fails to mount

---

## EXECUTE: Applied Fixes

### X-1: Server Enhancements

**Changes to `server.mjs`**:
1. Add explicit `/sw.js` route with `Cache-Control: no-cache`
2. ESM __dirname handling (already correct via `fileURLToPath`)
3. Add BUILD_ID support for cache busting

### X-2: Service Worker Hotfix Guard (NEW)

**One-time cleanup** (7-day window):
- Unregister all old SWs + clear caches on first load
- Controlled via env flag: `VITE_SW_HOTFIX_ENABLED=true` (default ON)
- Auto-disable after deployment date + 7 days

### X-3: Build Manifest Verifier (NEW)

**Post-build script** (`scripts/verify-build.cjs`):
- Parse `dist/index.html`
- Extract all `<script src>` and `<link href>`
- Assert each file exists in `dist/`
- Assert correct MIME type (via file extension)
- Fail build if missing or wrong type

### X-4: Boot Sentinel (NEW)

**Runtime check** (`src/lib/bootSentinel.ts`):
- 3s after DOMContentLoaded
- Check if `#root` has React children
- If not, POST to `/api/telemetry` (silent)
- Set `window.__BOOT_TIMEOUT__ = true`

---

## TEST: Automated Gates

### T-1: CI "No HTML as JS" Gate

**GitHub Action** (`.github/workflows/build-verification.yml`):
```yaml
- name: Verify Build Assets
  run: |
    npm run build
    node scripts/verify-build.cjs
```

**Checks**:
- All `<script>` tags reference existing files
- All assets return correct MIME types
- No 404s, no text/html for .js

### T-2: SW Freshness E2E (Playwright)

**Test** (`tests/e2e/sw-freshness.spec.ts`):
1. Build A → install SW
2. Build B (change BUILD_ID)
3. Navigate → assert new assets loaded
4. Assert no 404s in console

### T-3: Synthetic Smoke (Production)

**Endpoint** (`/healthz/assets`):
- Returns JSON with:
  - index.html status + cache header
  - Sample asset status + MIME type
  - SW registration status
- Run every 5 minutes (external monitoring)

---

## SUCCESS CRITERIA

✅ **L-1**: Evidence captured (server order, headers, SW)  
✅ **L-2**: React error identified (separate fix needed)  
🔄 **P-1 to P-5**: Fixes planned  
🔄 **X-1 to X-4**: Ready to execute  
🔄 **T-1 to T-3**: Tests ready to add  

**Next Action**: Apply X-1 to X-4 (backend/build changes only).

---

## FILES TO MODIFY

1. `server.mjs` → Add `/sw.js` cache header
2. `scripts/verify-build.cjs` → NEW (build verification)
3. `src/lib/bootSentinel.ts` → NEW (runtime check)
4. `src/main.tsx` → Import bootSentinel (1 line)
5. `.github/workflows/build-verification.yml` → NEW (CI gate)
6. `tests/e2e/sw-freshness.spec.ts` → NEW (Playwright test)
7. `public/sw.js` → Add BUILD_ID check (minor)
8. `index.html` → Add BUILD_ID injection (build step)

**Zero UI/UX changes. Zero layout/copy/route/style modifications.**
