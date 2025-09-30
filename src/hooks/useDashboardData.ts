import useSWR from 'swr';
import { supabase } from '@/integrations/supabase/client';
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

const fetcher = async (): Promise<DashboardSummary> => {
  try {
    const { data, error } = await supabase.functions.invoke('dashboard-summary', {
      body: {}
    });

    if (error) {
      console.error('Dashboard API error:', error);
      throw new Error(`Dashboard API failed: ${error.message || 'Unknown error'}`);
    }

    return data as DashboardSummary;
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    throw error;
  }
};

export const useDashboardData = () => {
  const { data, error, isLoading, mutate } = useSWR<DashboardSummary, Error>(
    'dashboard-summary',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Dedupe requests within 30s
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      fallbackData: undefined, // Don't use fallback to ensure we show loading state
      onError: (error) => {
        console.error('Dashboard data error:', error);
      }
    }
  );

  const formatTimeAgo = (isoString: string): string => {
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
  };

  // Friendly error message for UI
  const getErrorMessage = (): string => {
    if (!error) return '';
    
    if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
      return "Couldn't refresh right now. Check your connection";
    }
    
    if (error.message.includes('timeout')) {
      return "Taking longer than usual. We'll keep trying";
    }
    
    return "Something's not quite right. We're looking into it";
  };

  const lastUpdatedFormatted = data?.lastUpdated 
    ? `Last updated ${formatTimeAgo(data.lastUpdated)}`
    : '';

  return {
    kpis: data?.kpis || [],
    nextItems: data?.nextItems || [],
    transcripts: data?.transcripts || [],
    isLoading,
    error: error ? getErrorMessage() : null,
    lastUpdated: lastUpdatedFormatted,
    refresh: () => mutate(),
    hasData: !!data
  };
};