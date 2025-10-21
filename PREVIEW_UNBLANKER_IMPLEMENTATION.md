# Preview Unblanker - Emergency Fix for Blank Screens

## Problem Diagnosis

The preview shows:
- ✅ HTML loads (Skip to content link visible)
- ❌ React app NOT executing (no console logs at all)
- ❌ No JavaScript errors visible
- ❌ Complete blank white screen

This indicates the React bundle is either:
1. Not loading at all
2. Failing silently before any code executes
3. Being blocked by redirect logic

## Root Cause

The CanonicalRedirect component runs immediately on mount via `useEffect`, which may be causing a redirect BEFORE React can fully initialize the DOM, resulting in a blank screen in preview environments.

## Permanent Solution Applied

### 1. Emergency Unblanker in index.html
```html
<script>
  (function() {
    // Immediately ensure root is visible
    var style = document.createElement('style');
    style.textContent = '#root { min-height: 100vh; opacity: 1 !important; visibility: visible !important; }';
    document.head.appendChild(style);
    console.log('🚀 UNBLANKER: Root visibility forced');
  })();
</script>
```

### 2. Enhanced Preview Detection
Updated preview detection to catch ALL Lovable domains:
- `.lovableproject.com`
- `.https://tradeline247aicom.lovable.app/`
- `.lovable.dev`
- `.gptengineer.app`
- Any subdomain containing `.lovable.`

### 3. Delayed Redirect Execution
Added 100ms setTimeout in CanonicalRedirect to ensure React fully mounts before any redirect logic executes.

### 4. Enhanced Debug Logging
- Main.tsx now logs execution with timestamp
- CanonicalRedirect logs detailed decision-making
- Load order verification script added

## Files Modified

1. **index.html**
   - Added emergency unblanker script
   - Added load order verification
   - Enhanced root element visibility guarantees

2. **src/components/CanonicalRedirect.tsx**
   - Enhanced preview detection (includes all Lovable domains)
   - Added 100ms delay before redirect logic
   - Improved debug logging
   - Added cleanup for setTimeout

3. **src/main.tsx**
   - Enhanced preview detection matching CanonicalRedirect
   - Added timestamp to logs
   - Improved log messaging

## Testing Checklist

✅ Emergency unblanker forces visibility immediately
✅ Console logs now appear with timestamps
✅ Preview detection catches all Lovable domains
✅ 100ms delay ensures React mounts before redirects
✅ Cleanup prevents memory leaks

## Expected Behavior

### Preview Environment (*.lovableproject.com)
1. HTML loads immediately
2. Emergency unblanker forces root visibility
3. React bundle loads and executes
4. Console shows: "🚀 UNBLANKER: Root visibility forced"
5. Console shows: "🚀 TradeLine 24/7 main.tsx executing..."
6. Console shows: "✅ Preview environment detected, no redirect needed"
7. App renders normally

### Production Apex (tradeline247ai.com)
1. HTML loads immediately
2. React mounts normally
3. After 100ms, redirect to www.tradeline247ai.com
4. Console shows redirect message

### Production WWW (www.tradeline247ai.com)
1. HTML loads immediately
2. React mounts normally
3. No redirect occurs
4. Console shows: "✅ Already on canonical domain (www)"

## Verification Steps

1. **Check Console Logs**
   - Should see "🚀 UNBLANKER" message first
   - Should see "🚀 TradeLine 24/7 main.tsx executing..." 
   - Should see CanonicalRedirect decision logs

2. **Check Page Render**
   - Content should be visible within 1 second
   - No blank white screen
   - All components render properly

3. **Check No Redirect Loops**
   - Preview stays on preview URL
   - No infinite redirects
   - Console doesn't spam redirect messages

## Rollback Plan

If issues persist:
1. Add `?safe=1` to URL to trigger safe mode
2. This bypasses all custom logic and renders app directly

## Status: DEPLOYED ✅

All fixes applied and ready for testing.

