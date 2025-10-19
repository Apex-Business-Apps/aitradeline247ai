import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface OptimizedDataOptions {
  cacheTime?: number; // Cache time in milliseconds
  staleTime?: number; // Stale time in milliseconds
  refetchOnWindowFocus?: boolean;
  retryAttempts?: number;
}

// Production-ready cache with size management
const MAX_CACHE_SIZE = 50; // Prevent memory leaks
const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes absolute max
const dataCache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>(); // Request deduplication

export function useOptimizedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: OptimizedDataOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default cache
    staleTime = 30 * 1000, // 30 seconds stale time
    refetchOnWindowFocus = true,
    retryAttempts = 3
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCachedData = useCallback((cacheKey: string): T | null => {
    const cached = dataCache.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      dataCache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }, []);

  const setCachedData = useCallback((cacheKey: string, newData: T) => {
    dataCache.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      ttl: cacheTime
    });
  }, [cacheTime]);

  const isStale = useCallback((cacheKey: string): boolean => {
    const cached = dataCache.get(cacheKey);
    if (!cached) return true;
    
    return Date.now() - cached.timestamp > staleTime;
  }, [staleTime]);

  const fetchData = useCallback(async (isRefetch = false) => {
    if (isRefetch) {
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }

    // Request deduplication - prevent duplicate simultaneous requests
    const pendingRequest = pendingRequests.get(key);
    if (pendingRequest && !isRefetch) {
      try {
        const result = await pendingRequest;
        setData(result);
        setError(null);
        setIsLoading(false);
        return;
      } catch (err) {
        // If pending request failed, continue with new request
      }
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Check cache first (except for explicit refetch)
      if (!isRefetch) {
        const cachedData = getCachedData(key);
        if (cachedData && !isStale(key)) {
          setData(cachedData);
          setError(null);
          setIsLoading(false);
          return;
        }
      }

      // Create request promise for deduplication
      const requestPromise = fetcher();
      pendingRequests.set(key, requestPromise);

      const result = await requestPromise;
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      setError(null);
      setCachedData(key, result);
      retryCountRef.current = 0;
      
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
        
        setTimeout(() => {
          fetchData(isRefetch);
        }, retryDelay);
        return;
      }

      setError(error);
      
      // Use cached data as fallback if available
      const cachedData = getCachedData(key);
      if (cachedData && !data) {
        setData(cachedData);
      }
    } finally {
      // Clean up pending request
      pendingRequests.delete(key);
      setIsLoading(false);
      setIsRefetching(false);
      
      // Proactive cache cleanup to prevent memory leaks
      if (dataCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(dataCache.entries());
        const now = Date.now();
        
        // Remove oldest or expired entries
        const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < entries.length - MAX_CACHE_SIZE; i++) {
          dataCache.delete(sortedEntries[i][0]);
        }
        
        // Also remove very old entries regardless of size
        entries.forEach(([cacheKey, entry]) => {
          if (now - entry.timestamp > MAX_CACHE_AGE) {
            dataCache.delete(cacheKey);
          }
        });
      }
    }
  }, [key, fetcher, getCachedData, setCachedData, isStale, retryAttempts, data]);

  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    dataCache.delete(key);
    refetch();
  }, [key, refetch]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale(key)) {
        refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, isStale, key, refetch]);

  return {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
    invalidate,
    isStale: isStale(key)
  };
}

// Preload data utility
export function preloadData<T>(key: string, fetcher: () => Promise<T>) {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < 30000) {
    return; // Data is fresh, no need to preload
  }

  fetcher()
    .then(data => {
      dataCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000
      });
    })
    .catch(() => {
      // Silently fail preloading
    });
}

// Clear all cache utility
export function clearDataCache() {
  dataCache.clear();
  pendingRequests.clear();
}

// Get cache statistics for monitoring
export function getCacheStats() {
  return {
    size: dataCache.size,
    pendingRequests: pendingRequests.size,
    maxSize: MAX_CACHE_SIZE
  };
}
