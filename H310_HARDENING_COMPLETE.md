# H310 Hardening - Infrastructure Complete

**Status**: ✅ All guard rails, flags, and detection systems deployed  
**Date**: 2025-10-13  
**Next Step**: Reproduce error in dev to identify exact component(s)

---

## ✅ Completed Steps

### H310-0: Guardrails + Flags
- ✅ Added `H310_HARDENING` feature flag (default OFF, dev-only when ON)
- ✅ Structured logging for hook violations ready
- ✅ CI enforcement via ESLint configured

### H310-1: Reproduce & Pinpoint
- ✅ Dev-only error listener added to `main.tsx`
- ✅ Captures "Rendered more hooks" errors with full stack trace
- ✅ Logs to console with `H310_CAPTURE` prefix for easy filtering
- **Action Required**: Enable flag in dev, reproduce route that crashes, capture stack

### H310-3: ESLint Enforcement
- ✅ `eslint-plugin-react-hooks` already configured
- ✅ `rules-of-hooks` and `exhaustive-deps` active via recommended config
- ✅ CI runs `npm run lint -- --max-warnings 0`

### H310-5: E2E Tests
- ✅ Created `tests/e2e/h310-detection.spec.ts`
- ✅ Tests all critical routes for hook errors
- ✅ Fails CI if #310 detected in console or page errors
- ✅ New CI workflow `.github/workflows/h310-guard.yml` runs on all PRs

### H310-6: Runtime Sentinel
- ✅ Enhanced `bootSentinel.ts` to capture console errors when flag ON
- ✅ Reports first 3 console errors in telemetry payload
- ✅ Includes route, timestamp, and structured logs
- ✅ No UI changes; dev-only when flag enabled

### H310-8: Knowledge Lock-In
- ✅ PR checklist added to `.github/pull_request_template.md`
- ✅ Human-readable checklist for hook safety
- ✅ React Strict Mode already enabled in dev

---

## 🔧 Infrastructure Files Modified

| File | Change |
|------|--------|
| `src/config/featureFlags.ts` | Added `H310_HARDENING` flag |
| `src/main.tsx` | Added dev error listener for #310 capture |
| `src/lib/bootSentinel.ts` | Enhanced with console error capture |
| `tests/e2e/h310-detection.spec.ts` | New E2E test suite for hook errors |
| `.github/workflows/h310-guard.yml` | New CI workflow for hook safety |
| `.github/pull_request_template.md` | Added hooks checklist |

---

## 🚦 How to Use

### For Developers
1. **Enable flag**: Set `H310_HARDENING: true` in `src/config/featureFlags.ts`
2. **Run dev build**: `npm run dev`
3. **Reproduce crash**: Navigate to the route that shows blank screen
4. **Check console**: Look for `🚨 H310_CAPTURE` log with full stack trace
5. **Identify component**: Stack trace will point to exact file/line

### For CI/CD
- All PRs automatically run:
  - ESLint with zero warnings
  - E2E tests across critical routes
  - Hook error detection
- Merge blocked if any violations found

---

## 📋 Remaining Steps (H310-2, H310-4, H310-7, H310-9)

These steps require **identifying the exact component(s)** throwing #310:

### H310-2: Hooks Audit (Blocked - needs component identification)
- Checklist for each offending component:
  - [ ] All hooks at top-level
  - [ ] No hooks in loops/conditions
  - [ ] No `Component()` calls
  - [ ] No accidental state updates during render

### H310-4: Safe Refactors (Blocked - needs component identification)
- Fix identified components without UI changes
- Move early returns below hooks
- Extract child components for lists
- Replace function calls with JSX

### H310-7: Framework Hygiene
- ✅ React 18.3.1 (latest stable)
- ✅ No Next.js (using Vite + React Router)
- ✅ No framework-specific false positives

### H310-9: Final Acceptance (Ready after fixes)
- [ ] Dev run: no #310 on original repro route
- [ ] CI: All tests pass
- [ ] Merge with flag OFF

---

## 🎯 Next Action

**Enable the flag and reproduce:**

```typescript
// In src/config/featureFlags.ts
H310_HARDENING: true,  // Change from false
```

Then:
1. Run `npm run dev`
2. Navigate to route that shows blank screen
3. Check console for `🚨 H310_CAPTURE` log
4. Share the stack trace to identify the component

Once we have the component, we can proceed with H310-2 and H310-4.

---

## 📊 Test Coverage

| Test Type | Status | Location |
|-----------|--------|----------|
| ESLint Hook Rules | ✅ Active | `eslint.config.js` |
| E2E Hook Detection | ✅ Active | `tests/e2e/h310-detection.spec.ts` |
| Build Verification | ✅ Active | `.github/workflows/build-verification.yml` |
| H310 Guard CI | ✅ Active | `.github/workflows/h310-guard.yml` |
| Runtime Sentinel | ✅ Ready | `src/lib/bootSentinel.ts` (flag-gated) |

---

## 🔒 Safety Guarantees

1. **No UI Changes**: All modifications are backend/build/test infrastructure
2. **Flag-Gated**: Runtime telemetry only active when explicitly enabled
3. **Dev-Only**: Production behavior unchanged
4. **Idempotent**: Can be run multiple times safely
5. **Reversible**: Flag OFF = previous behavior restored

---

## 📚 References

- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [React Error #310](https://react.dev/errors/310) - "Rendered more hooks than during the previous render"
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [Playwright E2E Testing](https://playwright.dev/)
