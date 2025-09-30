import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Calendar, Phone, TrendingUp } from 'lucide-react';

const kpiData = [
  {
    id: 'bookings',
    title: 'Bookings this week',
    value: '47',
    trend: '+12%',
    subtitle: 'new appointments',
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    ariaLabel: '47 bookings this week, up 12%'
  },
  {
    id: 'payout',
    title: 'Expected payout',
    value: '$3,240',
    subtitle: 'Paid out on Dec 15',
    icon: DollarSign,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    ariaLabel: 'Expected payout $3,240, paid out on December 15th'
  },
  {
    id: 'answered',
    title: 'Calls we caught',
    value: '94%',
    trend: 'Up vs last week +8%',
    subtitle: 'response rate',
    icon: Phone,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    ariaLabel: '94% calls we caught, up 8% vs last week'
  },
  {
    id: 'rescued',
    title: 'Missed but saved',
    value: '8',
    badge: 'rescued',
    subtitle: 'became bookings',
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    ariaLabel: '8 missed calls but saved, became bookings'
  }
];

export const WinsSection: React.FC = () => {
  return (
    <section className="space-y-4" data-testid="kpi-section">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Quiet right now. Your next one will show up here.</p>
          </div>
        ) : (
          kpiData.map((kpi) => (
          <Card 
            key={kpi.id}
            className="relative overflow-hidden border-0"
            style={{ 
              boxShadow: 'var(--premium-shadow-subtle)',
              background: 'linear-gradient(135deg, hsl(var(--card) / 0.95) 0%, hsl(var(--card) / 0.9) 100%)'
            }}
            data-testid={`kpi-card-${kpi.id}`}
            role="article"
            aria-label={kpi.ariaLabel}
          >
            <CardContent className="p-3">
              {/* Icon and trend/badge row */}
              <div className="flex items-start justify-between mb-2">
                <div className={`p-1.5 rounded-md ${kpi.bgColor}`}>
                  <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
                </div>
                {kpi.trend && (
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {kpi.trend}
                  </div>
                )}
                {kpi.badge && (
                  <div className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                    {kpi.badge}
                  </div>
                )}
              </div>
              
              {/* Main value */}
              <div className="space-y-1">
                <div className="text-xl font-bold text-foreground">
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {kpi.title}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {kpi.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </section>
  );
};