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
      
      // Fetch Twilio call events
      const { data: callData, error: callError } = await supabase
        .from('analytics_events')
        .select('*')
        .in('event_type', ['twilio_call', 'twilio_call_status'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (callError) {
        throw callError;
      }

      // Process and deduplicate calls by call_sid
      const callMap = new Map<string, TwilioCall>();
      
      if (callData) {
        callData.forEach((event) => {
          const eventData = event.event_data as any;
          const callSid = eventData.call_sid;
          
          if (callSid) {
            const existingCall = callMap.get(callSid);
            const callData: TwilioCall = {
              call_sid: callSid,
              from_number: eventData.from_number || eventData.From || 'Unknown',
              to_number: eventData.to_number || eventData.To || '+15877428885',
              call_status: eventData.call_status || eventData.CallStatus || 'unknown',
              duration: eventData.duration || eventData.CallDuration,
              direction: eventData.direction || 'inbound',
              created_at: event.created_at,
              answered_by: eventData.answered_by || eventData.AnsweredBy,
              recording_url: eventData.recording_url || eventData.RecordingUrl
            };

            // Keep the most recent status update for each call
            if (!existingCall || new Date(event.created_at) > new Date(existingCall.created_at)) {
              callMap.set(callSid, callData);
            }
          }
        });
      }

      const processedCalls = Array.from(callMap.values());
      setCalls(processedCalls);

      // Calculate stats
      const totalCalls = processedCalls.length;
      const completedCalls = processedCalls.filter(call => call.call_status === 'completed').length;
      const missedCalls = processedCalls.filter(call => 
        ['no-answer', 'busy', 'failed', 'canceled'].includes(call.call_status)
      ).length;
      
      const durationsWithValues = processedCalls
        .filter(call => call.duration && call.duration > 0)
        .map(call => call.duration!);
      
      const averageDuration = durationsWithValues.length > 0 
        ? Math.round(durationsWithValues.reduce((sum, duration) => sum + duration, 0) / durationsWithValues.length)
        : 0;
      
      const answerRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

      setStats({
        totalCalls,
        completedCalls,
        missedCalls,
        averageDuration,
        answerRate
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
    
    // Set up real-time subscription for new calls
    const subscription = supabase
      .channel('twilio_calls')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'analytics_events',
          filter: 'event_type=in.(twilio_call,twilio_call_status)'
        }, 
        () => {
          fetchCalls(); // Refresh data when new calls come in
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
