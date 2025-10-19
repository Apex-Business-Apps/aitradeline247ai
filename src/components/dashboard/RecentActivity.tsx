import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { Skeleton } from '@/components/ui/skeleton';

const getActivityColor = (type: string) => {
  switch (type) {
    case 'call':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'config':
      return 'bg-brand-orange/10 text-brand-orange';
    case 'export':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'support':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const RecentActivity: React.FC = () => {
  const { activities, isLoading, error } = useRecentActivity();

  if (error) {
    return (
      <Card className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-lg font-bold text-foreground flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Activity className="h-5 w-5 text-primary/70" />
            </div>
            <span className="tracking-tight">Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-sm text-muted-foreground">Unable to load activity. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm"
      style={{ 
        boxShadow: 'var(--premium-shadow-subtle)',
        background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
        border: '1px solid hsl(var(--premium-border))'
      }}
    >
      {/* Premium Glass Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="text-lg font-bold text-foreground flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
            <Activity className="h-5 w-5 text-primary/70" />
          </div>
          <span className="tracking-tight">Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-4 p-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity to display.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted/20 scrollbar-track-transparent">
            {activities.map((activity, index) => (
            <div 
              key={activity.id} 
              className="group flex space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-muted/20 hover:to-muted/10 transition-all duration-300 hover:shadow-[var(--premium-shadow-subtle)] animate-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className={`p-3 rounded-xl ${getActivityColor(activity.type)} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary/90 transition-colors">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  {activity.description}
                </p>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground/60 font-medium bg-muted/20 px-2 py-1 rounded-full">
                    {activity.time}
                  </span>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
