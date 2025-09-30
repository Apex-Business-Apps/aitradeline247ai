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

  // Load data from localStorage on mount
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
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }, [key]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (state.data) {
      try {
        localStorage.setItem(`offline-${key}`, JSON.stringify({
          data: state.data,
          lastSync: state.lastSync
        }));
      } catch (error) {
        console.error('Failed to save offline data:', error);
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
    // This would integrate with your actual sync logic
    // For now, we'll just clear the operations
    console.log('Syncing pending operations:', state.pendingOperations);
    
    // In a real implementation, you'd process each operation
    setState(prev => ({
      ...prev,
      pendingOperations: [],
      lastSync: new Date()
    }));
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