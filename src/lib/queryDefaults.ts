/**
 * TanStack Query Default Configuration
 * Optimized to reduce Supabase query load and stay within limits
 */

import { QueryClient, DefaultOptions } from "@tanstack/react-query";

/**
 * Conservative defaults for analytics-heavy screens
 * Reduces unnecessary refetches
 */
export const queryDefaults: DefaultOptions = {
  queries: {
    // Cache data for 1 minute before considering it stale
    staleTime: 60_000,
    
    // Only retry failed queries once (not 3x default)
    retry: 1,
    
    // Don't refetch when window regains focus
    refetchOnWindowFocus: false,
    
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
    
    // Keep unused data in cache for 5 minutes
    gcTime: 5 * 60 * 1000,
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  },
  mutations: {
    // Retry mutations once on network errors
    retry: 1
  }
};

/**
 * Real-time defaults for critical data
 * Use sparingly - only for data that must be fresh
 */
export const realtimeQueryDefaults: Partial<DefaultOptions['queries']> = {
  staleTime: 0,
  refetchInterval: 30_000, // Poll every 30s
  refetchOnWindowFocus: true
};

/**
 * Analytics defaults - very conservative
 * For dashboards and reports that don't need to be real-time
 */
export const analyticsQueryDefaults: Partial<DefaultOptions['queries']> = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  retry: 0, // Don't retry analytics queries
  refetchOnWindowFocus: false,
  refetchOnMount: false
};

/**
 * Create QueryClient with optimized defaults
 */
export function createOptimizedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: queryDefaults
  });
}

/**
 * Query key factory for consistent cache management
 */
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    stats: (orgId: string) => [...queryKeys.dashboard.all, 'stats', orgId] as const,
  },
  
  // Call logs
  calls: {
    all: ['calls'] as const,
    list: (filters?: Record<string, any>) => 
      [...queryKeys.calls.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.calls.all, 'detail', id] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    events: (filters?: Record<string, any>) => 
      [...queryKeys.analytics.all, 'events', filters] as const,
    summary: (dateRange?: string) => 
      [...queryKeys.analytics.all, 'summary', dateRange] as const,
  },
  
  // Appointments
  appointments: {
    all: ['appointments'] as const,
    list: (orgId?: string) => 
      [...queryKeys.appointments.all, 'list', orgId] as const,
    detail: (id: string) => 
      [...queryKeys.appointments.all, 'detail', id] as const,
  },
  
  // Campaigns
  campaigns: {
    all: ['campaigns'] as const,
    list: (orgId?: string) => 
      [...queryKeys.campaigns.all, 'list', orgId] as const,
    detail: (id: string) => 
      [...queryKeys.campaigns.all, 'detail', id] as const,
  }
};

/**
 * Helper to invalidate related queries
 */
export function invalidateDashboardQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
}

/**
 * Helper to prefetch critical data
 */
export async function prefetchCriticalData(queryClient: QueryClient) {
  // Prefetch dashboard summary on app load
  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: async () => {
      // This will be implemented by your actual data fetching logic
      return null;
    },
    staleTime: 60_000
  });
}

