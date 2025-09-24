import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Calendar, Clock, TrendingUp } from 'lucide-react';

const winsData = [
  {
    id: 'revenue',
    title: 'Money earned this month',
    value: '$12,450',
    change: '+18%',
    subtitle: 'from appointments booked',
    icon: DollarSign,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  {
    id: 'bookings',
    title: 'New appointments booked',
    value: '47',
    change: '+12%',
    subtitle: 'this week',
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  {
    id: 'time-saved',
    title: 'Time saved for you',
    value: '23 hours',
    change: 'this month',
    subtitle: 'no more missed calls',
    icon: Clock,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    id: 'conversion',
    title: 'Visitors becoming customers',
    value: '68%',
    change: '+4%',
    subtitle: 'conversion rate',
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  }
];

export const WinsSection: React.FC = () => {
  return (
    <section className="space-y-4" data-testid="wins-section">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Your wins this month</h2>
        <p className="text-sm text-muted-foreground">Here's how your AI receptionist is growing your business</p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {winsData.map((win) => (
          <Card 
            key={win.id}
            className="relative overflow-hidden border-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            style={{ 
              boxShadow: 'var(--premium-shadow-subtle)',
              background: 'linear-gradient(135deg, hsl(var(--card) / 0.95) 0%, hsl(var(--card) / 0.9) 100%)'
            }}
            data-testid={`win-card-${win.id}`}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <CardContent className="p-4 relative z-10">
              {/* Icon and value row */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${win.bgColor}`}>
                  <win.icon className={`h-4 w-4 ${win.color}`} />
                </div>
                {win.change.startsWith('+') && (
                  <div className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                    {win.change}
                  </div>
                )}
              </div>
              
              {/* Main value */}
              <div className="space-y-1 mb-2">
                <div className="text-2xl font-bold text-foreground">
                  {win.value}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {win.title}
                </p>
              </div>
              
              {/* Subtitle */}
              <p className="text-xs text-muted-foreground/80">
                {win.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};