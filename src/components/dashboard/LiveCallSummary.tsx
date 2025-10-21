import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useTwilioCallData } from '@/hooks/useTwilioCallData';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'ringing':
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'no-answer':
    case 'busy':
    case 'failed':
    case 'canceled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getCallType = (fromNumber: string, duration?: number) => {
  // Simple heuristic to categorize calls
  if (!duration || duration < 30) return 'missed';
  if (duration < 120) return 'inquiry';
  if (duration < 300) return 'support';
  return 'appointment';
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'appointment':
      return 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
    case 'inquiry':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    case 'support':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800';
    case 'missed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const LiveCallSummary: React.FC = () => {
  const { calls, loading, error, formatDuration, formatTimeAgo } = useTwilioCallData();

  // Show recent calls (last 4)
  const recentCalls = calls.slice(0, 4);

  if (loading && calls.length === 0) {
    return (
      <Card className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-foreground flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Phone className="h-5 w-5 text-primary/70" />
            </div>
            <span className="tracking-tight">Recent Calls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading call data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-foreground flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Phone className="h-5 w-5 text-primary/70" />
            </div>
            <span className="tracking-tight">Recent Calls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Unable to load call data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentCalls.length === 0) {
    return (
      <Card 
        className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm group"
        style={{ 
          boxShadow: 'var(--premium-shadow-subtle)',
          background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
          border: '1px solid hsl(var(--premium-border))'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="text-lg font-bold text-foreground flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Phone className="h-5 w-5 text-primary/70" />
            </div>
            <span className="tracking-tight">Recent Calls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 flex items-center justify-center py-8">
          <div className="text-center">
            <Phone className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No calls yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Call +1-587-742-8885 to test the system
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm group"
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
            <Phone className="h-5 w-5 text-primary/70" />
          </div>
          <span className="tracking-tight">Recent Calls</span>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        {recentCalls.map((call, index) => {
          const callType = getCallType(call.from_number, call.duration);
          const caller = call.from_number.replace('+1', '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
          
          return (
            <div 
              key={call.call_sid} 
              className="group/item flex items-center justify-between space-x-4 p-4 rounded-2xl bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 border border-transparent hover:border-primary/10 transition-all duration-300 hover:shadow-[var(--premium-shadow-subtle)] animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <p className="text-sm font-semibold text-foreground truncate group-hover/item:text-primary/90 transition-colors">
                    {caller}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-medium px-2 py-1 ${getStatusColor(call.call_status)} border-0`}
                  >
                    {call.call_status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground/80">
                  <span className="font-medium">{formatTimeAgo(call.created_at)}</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono">{formatDuration(call.duration)}</span>
                  </div>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs font-medium px-3 py-1 ${getTypeColor(callType)} border-0`}
              >
                {callType}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
