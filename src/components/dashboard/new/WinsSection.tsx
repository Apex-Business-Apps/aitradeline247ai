import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, TrendingUp, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Win {
  id: string;
  event_type: string;
  created_at: string;
  event_data: any;
}

export const WinsSection: React.FC = () => {
  const [wins, setWins] = useState<Win[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentWins() {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch booking events and completed calls from last 7 days
        const { data, error } = await supabase
          .from('analytics_events')
          .select('*')
          .in('event_type', ['appointment_created', 'voice_call_completed', 'lead_captured'])
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setWins(data || []);
      } catch (error) {
        console.error('Error fetching wins:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentWins();
  }, []);

  const getWinIcon = (eventType: string) => {
    if (eventType.includes('appointment')) return CheckCircle2;
    if (eventType.includes('call')) return Phone;
    return TrendingUp;
  };

  const getWinLabel = (eventType: string) => {
    if (eventType === 'appointment_created') return 'New booking';
    if (eventType === 'voice_call_completed') return 'Call completed';
    if (eventType === 'lead_captured') return 'Lead captured';
    return 'Activity';
  };

  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Wins</CardTitle>
        <p className="text-sm text-muted-foreground">
          Good things happening this week
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : wins.length > 0 ? (
          <div className="space-y-3">
            {wins.map((win) => {
              const Icon = getWinIcon(win.event_type);
              return (
                <div 
                  key={win.id} 
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getWinLabel(win.event_type)}</p>
                    <p className="text-xs text-muted-foreground">{formatTimeAgo(win.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your AI receptionist hasn't logged activity yet this week. Check back soon!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
