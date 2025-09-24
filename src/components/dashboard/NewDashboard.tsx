import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WelcomeHeader } from './new/WelcomeHeader';
import { NextActionsSection } from './new/NextActionsSection';
import { WinsSection } from './new/WinsSection';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KpiCard } from './components/KpiCard';
import { Calendar, DollarSign, Phone, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const NewDashboard = () => {
  const { kpis, nextItems, transcripts, isLoading, hasData } = useDashboardData();

  const getKpiConfig = (id: string) => {
    const configs = {
      bookings: {
        title: 'Bookings this week',
        subtitle: 'New appointments scheduled',
        icon: Calendar,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        ariaLabel: 'Weekly bookings performance'
      },
      payout: {
        title: 'Expected payout',
        subtitle: 'Revenue from active calls',
        icon: DollarSign,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        ariaLabel: 'Expected revenue payout'
      },
      answerRate: {
        title: 'Calls we caught',
        subtitle: 'Answer rate this period',
        icon: Phone,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        ariaLabel: 'Call answer rate performance'
      },
      rescued: {
        title: 'Missed but saved',
        subtitle: 'Calls recovered by AI',
        icon: Shield,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        ariaLabel: 'Calls rescued from being missed'
      }
    };
    return configs[id] || configs.bookings;
  };

  return (
    <div className="space-y-6">
      <WelcomeHeader />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden border-0">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : hasData ? (
          // Real KPI data
          kpis.map((kpi) => {
            const config = getKpiConfig(kpi.id);
            return (
              <KpiCard
                key={kpi.id}
                kpi={kpi}
                {...config}
                trend={kpi.deltaPct ? (kpi.deltaPct > 0 ? `+${kpi.deltaPct}%` : `${kpi.deltaPct}%`) : undefined}
              />
            );
          })
        ) : (
          // Empty state fallback
          Array.from({ length: 4 }).map((_, i) => {
            const configs = [
              { title: 'Bookings this week', subtitle: 'Quiet right now — your next one will show up here.' },
              { title: 'Expected payout', subtitle: 'Revenue tracking will appear here soon.' },
              { title: 'Calls we caught', subtitle: 'Call metrics loading...' },
              { title: 'Missed but saved', subtitle: 'Rescue stats coming up.' }
            ];
            return (
              <Card key={i} className="relative overflow-hidden border-0 opacity-60">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-muted-foreground">--</div>
                    <p className="text-xs text-muted-foreground">{configs[i].title}</p>
                    <p className="text-xs text-muted-foreground/70">{configs[i].subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NextActionsSection nextItems={nextItems} isLoading={isLoading} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 bg-card/50 rounded-lg">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasData && transcripts.length > 0 ? (
                <div className="space-y-3">
                  {transcripts.map((transcript) => (
                    <div key={transcript.id} className="flex items-start space-x-3 p-3 bg-card/50 rounded-lg border border-border/50">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{transcript.caller}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(transcript.atISO).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{transcript.summary}</p>
                        {transcript.needsReply && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            Needs reply
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">We'll drop new call notes here. Check back soon.</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <WinsSection />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">One-click shortcuts will be available here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};