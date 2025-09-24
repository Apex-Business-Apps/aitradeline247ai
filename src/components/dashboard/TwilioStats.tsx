import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneCall, PhoneMissed, Clock } from 'lucide-react';
import { useTwilioCallData } from '@/hooks/useTwilioCallData';

export const TwilioStats: React.FC = () => {
  const { stats, loading } = useTwilioCallData();

  const statCards = [
    {
      title: 'Total Calls',
      value: stats.totalCalls.toString(),
      icon: Phone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      description: 'All incoming calls'
    },
    {
      title: 'Answered',
      value: stats.completedCalls.toString(),
      icon: PhoneCall,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900',
      description: 'Successfully connected'
    },
    {
      title: 'Missed',
      value: stats.missedCalls.toString(),
      icon: PhoneMissed,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900',
      description: 'No answer or busy'
    },
    {
      title: 'Avg Duration',
      value: `${Math.floor(stats.averageDuration / 60)}:${(stats.averageDuration % 60).toString().padStart(2, '0')}`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      description: 'Average call time'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card 
            key={stat.title}
            className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm group hover:shadow-lg transition-all duration-300"
            style={{ 
              boxShadow: 'var(--premium-shadow-subtle)',
              background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
              border: '1px solid hsl(var(--premium-border))'
            }}
          >
            {/* Premium Glass Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${stat.bgColor}/10`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-foreground group-hover:text-primary/90 transition-colors">
                {loading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              {stat.title === 'Answered' && stats.totalCalls > 0 && (
                <div className="mt-2">
                  <div className={`text-xs font-medium ${stat.color}`}>
                    {stats.answerRate}% answer rate
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};