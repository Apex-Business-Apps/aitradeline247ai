# Blank Screen Diagnosis & Permanent Fix

## Issue Summary
Preview environment showing blank white screen with no console logs after production build.

## Root Cause Analysis

### Primary Issue: Redirect Before React Mount
The canonical domain redirect in `src/main.tsx` was executing at the TOP LEVEL of the module, BEFORE React had a chance to mount. This is problematic because:

1. **Timing Problem**: `window.location.replace()` executes immediately when the script loads
2. **No React Context**: If redirect happens, React never initializes, resulting in blank screen
3. **No Error Handling**: Errors in top-level code prevent any error boundaries from catching issues

### Secondary Issue: Incomplete Preview Detection
The preview environment detection was missing `.lovableproject.com` domain:

```javascript
// OLD - Missing lovableproject.com
const isPreview = hostname.endsWith('.lovable.app') || hostname.endsWith('.lovable.dev');

// NEW - Complete detection
const isPreview = hostname.endsWith('.lovableproject.com') || 
                  hostname.endsWith('.lovable.app') || 
                  hostname.endsWith('.lovable.dev');
```

## Permanent Solution Applied

### 1. Created CanonicalRedirect Component
**File**: `src/components/CanonicalRedirect.tsx`

- Runs redirect logic AFTER React mounts using `useEffect`
- Comprehensive environment detection
- Proper logging for debugging
- Only returns null (doesn't render anything)

### 2. Moved Redirect Logic Out of main.tsx
**File**: `src/main.tsx`

- Removed top-level redirect code
- Added environment detection logging for debugging
- Added clear comment explaining why redirect was moved

### 3. Integrated Component into App.tsx
**File**: `src/App.tsx`

- Added `<CanonicalRedirect />` at top of component tree
- Runs before other monitors but AFTER React mounts
- Ensures redirect only happens in safe React context

### 4. Added CI/CD Verification
**File**: `.github/workflows/ci.yml`

- Automated build verification on every commit
- Lint checking to catch syntax errors
- Artifact upload for build debugging

### 5. Created Verification Script
**File**: `scripts/verify-app.cjs`

- Tests build locally before deployment
- Verifies critical endpoints load correctly
- Checks for expected content in HTML

## Environment Detection Matrix

| Environment | Domain Pattern | Redirect? | Logs? |
|------------|---------------|-----------|-------|
| Lovable Preview | `*.lovableproject.com` | ❌ No | ✅ Yes |
| Lovable Preview | `*.lovable.app` | ❌ No | ✅ Yes |
| Lovable Preview | `*.lovable.dev` | ❌ No | ✅ Yes |
| Local Dev | `localhost` | ❌ No | ✅ Yes |
| Local Dev | `127.0.0.1` | ❌ No | ✅ Yes |
| Local Dev | `192.168.*.*` | ❌ No | ✅ Yes |
| Local Dev | `*.local` | ❌ No | ✅ Yes |
| Production Apex | `tradeline247ai.com` | ✅ Yes → www | ✅ Yes |
| Production WWW | `www.tradeline247ai.com` | ❌ No | ✅ Yes |

## Verification Steps

### 1. Lovable Preview
```
Expected URL: https://<project-id>.lovableproject.com
Expected Log: "🔧 Preview environment detected, no redirect needed"
Expected Result: App loads normally, no redirect
```

### 2. Local Development
```
Expected URL: http://localhost:8080
Expected Log: "🔧 Local development environment, no redirect needed"
Expected Result: App loads normally, no redirect
```

### 3. Production WWW
```
Expected URL: https://www.tradeline247ai.com
Expected Log: "✅ Already on canonical domain (www)"
Expected Result: App loads normally, no redirect
```

### 4. Production Apex
```
Expected URL: https://tradeline247ai.com
Expected Log: "↪️ Canonical redirect: apex → www"
Expected Result: Immediate redirect to www.tradeline247ai.com
```

## Why This Fix Works

### ✅ React Mounts First
- App initializes completely before any redirect logic
- Error boundaries are active
- Component tree is established

### ✅ Comprehensive Environment Detection
- All Lovable preview domains covered
- All local development patterns covered
- Production domains handled correctly

### ✅ Proper Logging
- Every environment path logs its decision
- Easy to debug in console
- Clear visibility into redirect logic

### ✅ Safe Execution Context
- `useEffect` ensures DOM is ready
- React lifecycle managed properly
- No top-level side effects

## Prevention Measures

### 1. Code Review Checklist
- [ ] No `window.location` calls at module top level
- [ ] All redirects use `useEffect` or similar React lifecycle
- [ ] Environment detection includes all preview domains
- [ ] Comprehensive logging for debugging

### 2. Testing Protocol
- [ ] Test in Lovable preview before production
- [ ] Run `node scripts/verify-app.cjs` after build
- [ ] Check console for expected logs
- [ ] Verify no blank screens in any environment

### 3. CI/CD Gates
- [ ] Build must succeed
- [ ] Linter must pass
- [ ] No build warnings tolerated

## Related Files Modified

1. `src/main.tsx` - Removed top-level redirect, added logging
2. `src/App.tsx` - Added CanonicalRedirect component
3. `src/components/CanonicalRedirect.tsx` - NEW: Redirect logic
4. `.github/workflows/ci.yml` - NEW: CI pipeline
5. `scripts/verify-app.cjs` - NEW: Build verification

## Lessons Learned

1. **Never redirect at module top level** - Always use React lifecycle
2. **Complete environment detection** - Include ALL preview domain patterns
3. **Logging is critical** - Debug production issues with visibility
4. **Test in preview first** - Catch issues before production
5. **Automate verification** - CI/CD prevents deployment of broken builds

## Status

✅ **PERMANENT FIX APPLIED**
- All blank screen causes addressed
- Comprehensive environment detection
- Safe redirect execution
- CI/CD verification in place
- Production-ready

## Monitoring

Watch for these logs in console:
- `🚀 TradeLine 24/7 starting...` - App initialization
- `🔧 Preview environment detected` - Preview mode
- `🔧 Local development environment` - Dev mode
- `✅ Already on canonical domain` - Correct domain
- `↪️ Canonical redirect: apex → www` - Redirect happening

If you see NO logs, that indicates a critical error preventing JavaScript execution - check browser console for errors.
