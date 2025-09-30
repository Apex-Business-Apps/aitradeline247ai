import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

export function useRealtimeData<T>(
  initialData: T[],
  options: RealtimeOptions
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    table,
    schema = 'public',
    filter,
    event = '*'
  } = options;

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtime = () => {
      try {
        channel = supabase
          .channel(`realtime-${table}`)
          .on(
            'postgres_changes' as any,
            {
              event,
              schema,
              table,
              filter
            } as any,
            (payload: any) => {
              console.log('Realtime payload:', payload);
              
              switch (payload.eventType) {
                case 'INSERT':
                  setData(prev => [...prev, payload.new as T]);
                  break;
                case 'UPDATE':
                  setData(prev => 
                    prev.map(item => 
                      (item as any).id === (payload.new as any).id 
                        ? payload.new as T 
                        : item
                    )
                  );
                  break;
                case 'DELETE':
                  setData(prev => 
                    prev.filter(item => 
                      (item as any).id !== (payload.old as any).id
                    )
                  );
                  break;
              }
            }
          )
          .subscribe((status) => {
            console.log('Realtime subscription status:', status);
            setIsConnected(status === 'SUBSCRIBED');
            
            if (status === 'CHANNEL_ERROR') {
              setError(new Error('Realtime connection failed'));
            } else {
              setError(null);
            }
          });
      } catch (err) {
        console.error('Realtime setup error:', err);
        setError(err instanceof Error ? err : new Error('Unknown realtime error'));
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, schema, filter, event]);

  const updateData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  return {
    data,
    isConnected,
    error,
    updateData
  };
}

// Hook for realtime appointment updates
export function useRealtimeAppointments(orgId: string) {
  return useRealtimeData([], {
    table: 'appointments',
    filter: `organization_id=eq.${orgId}`,
    event: '*'
  });
}

// Hook for realtime analytics events
export function useRealtimeAnalytics() {
  return useRealtimeData([], {
    table: 'analytics_events',
    event: 'INSERT'
  });
}