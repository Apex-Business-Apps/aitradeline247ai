import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock } from 'lucide-react';

const recentCalls = [
  {
    id: '1',
    caller: 'John Smith',
    time: '2 mins ago',
    duration: '3:24',
    status: 'completed',
    type: 'appointment'
  },
  {
    id: '2',
    caller: 'Sarah Johnson',
    time: '8 mins ago',
    duration: '1:47',
    status: 'completed',
    type: 'inquiry'
  },
  {
    id: '3',
    caller: 'Mike Chen',
    time: '15 mins ago',
    duration: '4:12',
    status: 'completed',
    type: 'support'
  },
  {
    id: '4',
    caller: 'Lisa Brown',
    time: '32 mins ago',
    duration: '2:18',
    status: 'missed',
    type: 'appointment'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'missed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'appointment':
      return 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
    case 'inquiry':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    case 'support':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const CallSummary: React.FC = () => {
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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        {recentCalls.map((call, index) => (
          <div 
            key={call.id} 
            className="group/item flex items-center justify-between space-x-4 p-4 rounded-2xl bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 border border-transparent hover:border-primary/10 transition-all duration-300 hover:shadow-[var(--premium-shadow-subtle)] animate-fade-in"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <p className="text-sm font-semibold text-foreground truncate group-hover/item:text-primary/90 transition-colors">
                  {call.caller}
                </p>
                <Badge 
                  variant="secondary" 
                  className={`text-xs font-medium px-2 py-1 ${getStatusColor(call.status)} border-0`}
                >
                  {call.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground/80">
                <span className="font-medium">{call.time}</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">{call.duration}</span>
                </div>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs font-medium px-3 py-1 ${getTypeColor(call.type)} border-0`}
            >
              {call.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};