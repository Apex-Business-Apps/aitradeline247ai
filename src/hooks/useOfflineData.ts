import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Offline data helper.
 * Key fix: memoize functions referenced in effects and include them in deps.
 */

type OfflineState<T> = {
  data: T | null;
  lastSync?: number;
};

type Options<T> = {
  initial?: T | null;
  onPersist?: (data: T | null) => Promise<void> | void;
  onLoad?: () => Promise<T | null> | T | null;
  clearImpl?: () => Promise<void> | void;
};

export function useOfflineData<T = unknown>(opts: Options<T> = {}) {
  const { initial = null, onPersist, onLoad, clearImpl } = opts;

  const [state, setState] = useState<OfflineState<T>>({
    data: initial,
    lastSync: undefined,
  });
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const setData = useCallback((data: T | null) => {
    setState((s) => ({ ...s, data }));
  }, []);

  const markSynced = useCallback(() => {
    setState((s) => ({ ...s, lastSync: Date.now() }));
  }, []);

  const persist = useCallback(
    async (data: T | null) => {
      if (!onPersist) return;
      await onPersist(data);
      markSynced();
    },
    [onPersist, markSynced]
  );

  const load = useCallback(async () => {
    if (!onLoad) return;
    const loaded = await onLoad();
    setData(loaded);
    markSynced();
  }, [onLoad, setData, markSynced]);

  const clearOfflineData = useCallback(async () => {
    if (clearImpl) await clearImpl();
    setData(null);
  }, [clearImpl, setData]);

  useEffect(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);

    const run = async () => {
      try {
        await persist(state.data);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    };

    if (state.data !== undefined) {
      void run();
    }
    // include clearOfflineData per exhaustive-deps rule (even if not invoked every run)
  }, [persist, state.data, state.lastSync, clearOfflineData]);

  return {
    busy,
    state,
    setData,
    load,
    persist,
    clearOfflineData,
  };
}

export default useOfflineData;
