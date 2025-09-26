import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TwilioCall {
  call_sid: string;
  from_number: string;
  to_number: string;
  call_status: string;
  duration?: number;
  direction: string;
  created_at: string;
  answered_by?: string;
  recording_url?: string;
}

export interface CallStats {
  totalCalls: number;
  completedCalls: number;
  missedCalls: number;
  averageDuration: number;
  answerRate: number;
}

export const useTwilioCallData = () => {
  const [calls, setCalls] = useState<TwilioCall[]>([]);
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    completedCalls: 0,
    missedCalls: 0,
    averageDuration: 0,
    answerRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      
      // TODO: Create analytics_events table when implementing call tracking
      // For now, return mock data to prevent build errors
      const mockCalls: TwilioCall[] = [];
      setCalls(mockCalls);

      // Set default stats
      setStats({
        totalCalls: 0,
        completedCalls: 0,
        missedCalls: 0,
        averageDuration: 0,
        answerRate: 0
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching Twilio call data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch call data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    fetchCalls();
    
    // TODO: Set up real-time subscription when analytics_events table exists
    // For now, just fetch once
  }, []);

  return {
    calls,
    stats,
    loading,
    error,
    refresh: fetchCalls,
    formatDuration,
    formatTimeAgo
  };
};
