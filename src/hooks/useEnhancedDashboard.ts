import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedData } from './useOptimizedData';
import { Kpi, NextItem, Transcript } from '@/types/dashboard';

interface DashboardSummary {
  kpis: Kpi[];
  nextItems: NextItem[];
  transcripts: Transcript[];
  lastUpdated: string;
}

interface DashboardError {
  error: string;
  message?: string;
  lastUpdated?: string;
}

const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const { data, error } = await supabase.functions.invoke('dashboard-summary', {
      body: {},
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (error) {
      console.error('Dashboard API error:', error);
      throw new Error(`Dashboard API failed: ${error.message || 'Unknown error'}`);
    }

    if (!data) {
      throw new Error('No data returned from dashboard API');
    }

    return data as DashboardSummary;
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    throw error;
  }
};

export const useEnhancedDashboard = () => {
  const {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
    invalidate,
    isStale
  } = useOptimizedData<DashboardSummary>(
    'dashboard-summary',
    fetchDashboardSummary,
    {
      cacheTime: 5 * 60 * 1000, // 5 minutes cache
      staleTime: 60 * 1000, // 1 minute stale time
      refetchOnWindowFocus: true,
      retryAttempts: 3
    }
  );

  const formatTimeAgo = useCallback((isoString: string): string => {
    if (!isoString) return 'Unknown';
    
    try {
      const now = new Date();
      const then = new Date(isoString);
      const diffMs = now.getTime() - then.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      console.warn('Date parsing error:', e);
      return 'Unknown';
    }
  }, []);

  const getErrorMessage = useCallback((): string => {
    if (!error) return '';
    
    if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
      return "Couldn't refresh right now. Check your connection";
    }
    
    if (error.message.includes('timeout')) {
      return "Taking longer than usual. We'll keep trying";
    }
    
    if (error.message.includes('No data returned')) {
      return "Dashboard service is starting up. Please wait";
    }
    
    return "Something's not quite right. We're looking into it";
  }, [error]);

  const lastUpdatedFormatted = data?.lastUpdated 
    ? `Last updated ${formatTimeAgo(data.lastUpdated)}`
    : '';

  // Force refresh function for manual refresh
  const forceRefresh = useCallback(() => {
    invalidate();
  }, [invalidate]);

  return {
    kpis: data?.kpis || [],
    nextItems: data?.nextItems || [],
    transcripts: data?.transcripts || [],
    isLoading,
    isRefetching,
    error: error ? getErrorMessage() : null,
    lastUpdated: lastUpdatedFormatted,
    refresh: refetch,
    forceRefresh,
    hasData: !!data,
    isStale
  };
};