import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Example hook that enforces session timeouts, activity tracking, etc.
 * Fix: memoize functions referenced in effects and include them in deps.
 */

type SecurityOptions = {
  inactivityMs?: number;
  onTimeout?: () => void | Promise<void>;
  onWarning?: (msLeft: number) => void | Promise<void>;
};

export function useEnhancedSessionSecurity(opts: SecurityOptions = {}) {
  const { inactivityMs = 15 * 60_000, onTimeout, onWarning } = opts;

  const [lastActivity, setLastActivity] = useState<number>(() => Date.now());
  const warnRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOut = useCallback(async () => {
    if (onTimeout) await onTimeout();
  }, [onTimeout]);

  const sessionTimeoutWarning = useCallback(
    async (msLeft: number) => {
      if (onWarning) await onWarning(msLeft);
    },
    [onWarning]
  );

  const recordActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    // global listeners to track activity
    window.addEventListener('click', recordActivity);
    window.addEventListener('keydown', recordActivity);
    return () => {
      window.removeEventListener('click', recordActivity);
      window.removeEventListener('keydown', recordActivity);
    };
  }, [recordActivity]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const now = Date.now();
    const elapsed = now - lastActivity;
    const remaining = inactivityMs - elapsed;

    if (remaining <= 0) {
      void signOut();
      return;
    }

    // optional warning at 30s remaining
    if (remaining <= 30_000 && warnRef.current !== lastActivity) {
      warnRef.current = lastActivity;
      void sessionTimeoutWarning(remaining);
    }

    timerRef.current = setTimeout(() => {
      void signOut();
    }, remaining);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [inactivityMs, lastActivity, sessionTimeoutWarning, signOut]);

  return { recordActivity, lastActivity };
}

export default useEnhancedSessionSecurity;

