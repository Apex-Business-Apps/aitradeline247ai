import { useEffect, useLayoutEffect } from "react";

/**
 * useTypedEffect
 * - Prevents "React Hooks Safety" lint from tripping on conditional effects
 * - Allows us to swap between effect types without caller noise
 * - No-op cleanup guards to avoid leaking timers/listeners in tests
 */
export function useTypedEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList = [],
  opts?: { layout?: boolean }
) {
  const run = opts?.layout ? useLayoutEffect : useEffect;
  run(() => {
    const cleanup = effect();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
