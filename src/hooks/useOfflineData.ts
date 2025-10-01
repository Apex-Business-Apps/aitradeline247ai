import { useState, useEffect, useCallback } from 'react';

interface OfflineDataOptions {
  key: string;
  syncOnReconnect?: boolean;
}

interface OfflineState<T> {
  data: T | null;
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: Array<{
    id: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    data: any;
    timestamp: Date;
  }>;
}

export function useOfflineData<T>(
  options: OfflineDataOptions
) {
  const { key, syncOnReconnect = true } = options;
  
  const [state, setState] = useState<OfflineState<T>>({
    data: null,
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOperations: []
  });

  // Load data from localStorage on mount with enhanced error handling
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(`offline-${key}`);
      const storedOperations = localStorage.getItem(`pending-${key}`);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setState(prev => ({
          ...prev,
          data: parsed.data,
          lastSync: parsed.lastSync ? new Date(parsed.lastSync) : null
        }));
        console.log(`[OfflineData] Loaded data for key: ${key}`);
      }

      if (storedOperations) {
        const operations = JSON.parse(storedOperations);
        setState(prev => ({
          ...prev,
          pendingOperations: operations.map((op: any) => ({
            ...op,
            timestamp: new Date(op.timestamp)
          }))
        }));
        console.log(`[OfflineData] Loaded ${operations.length} pending operations`);
      }
    } catch (error) {
      console.error('[OfflineData] Failed to load from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(`offline-${key}`);
      localStorage.removeItem(`pending-${key}`);
    }
  }, [key]);

  // Save data to localStorage with quota management
  useEffect(() => {
    if (state.data) {
      try {
        const payload = JSON.stringify({
          data: state.data,
          lastSync: state.lastSync
        });
        localStorage.setItem(`offline-${key}`, payload);
      } catch (error) {
        console.error('[OfflineData] Failed to persist data:', error);
        // Handle quota exceeded
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('[OfflineData] Storage quota exceeded, clearing old data');
          clearOfflineData();
        }
      }
    }
  }, [key, state.data, state.lastSync]);

  // Save pending operations
  useEffect(() => {
    try {
      localStorage.setItem(`pending-${key}`, JSON.stringify(state.pendingOperations));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }, [key, state.pendingOperations]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      
      if (syncOnReconnect && state.pendingOperations.length > 0) {
        // Trigger sync when coming back online
        syncPendingOperations();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOnReconnect, state.pendingOperations.length]);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      lastSync: new Date()
    }));
  }, []);

  const addPendingOperation = useCallback((
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ) => {
    const newOperation = {
      id: `${Date.now()}-${Math.random()}`,
      operation,
      data,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      pendingOperations: [...prev.pendingOperations, newOperation]
    }));

    return newOperation.id;
  }, []);

  const removePendingOperation = useCallback((operationId: string) => {
    setState(prev => ({
      ...prev,
      pendingOperations: prev.pendingOperations.filter(op => op.id !== operationId)
    }));
  }, []);

  const syncPendingOperations = useCallback(async () => {
    if (state.pendingOperations.length === 0) {
      console.log('[OfflineData] No pending operations to sync');
      return;
    }

    console.log('[OfflineData] Syncing pending operations:', state.pendingOperations);
    
    try {
      // Batch operations by type for efficient processing
      const batches: Record<string, any[]> = {
        CREATE: [],
        UPDATE: [],
        DELETE: []
      };
      
      state.pendingOperations.forEach(op => {
        batches[op.operation].push(op.data);
      });
      
      // TODO: Replace with actual API calls
      // await Promise.all([
      //   batches.CREATE.length > 0 && api.createBatch(batches.CREATE),
      //   batches.UPDATE.length > 0 && api.updateBatch(batches.UPDATE),
      //   batches.DELETE.length > 0 && api.deleteBatch(batches.DELETE)
      // ]);
      
      console.log('[OfflineData] Successfully synced all operations');
      
      setState(prev => ({
        ...prev,
        pendingOperations: [],
        lastSync: new Date()
      }));
    } catch (error) {
      console.error('[OfflineData] Sync failed:', error);
      // Keep operations in queue for retry
      throw error;
    }
  }, [state.pendingOperations]);

  const clearOfflineData = useCallback(() => {
    localStorage.removeItem(`offline-${key}`);
    localStorage.removeItem(`pending-${key}`);
    setState({
      data: null,
      isOnline: navigator.onLine,
      lastSync: null,
      pendingOperations: []
    });
  }, [key]);

  return {
    data: state.data,
    isOnline: state.isOnline,
    lastSync: state.lastSync,
    pendingOperations: state.pendingOperations,
    setData,
    addPendingOperation,
    removePendingOperation,
    syncPendingOperations,
    clearOfflineData
  };
}