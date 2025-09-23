import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Clock, TrendingUp, Users } from 'lucide-react';

const stats = [
  {
    title: 'Total Calls',
    value: '2,847',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: Phone,
    description: 'Calls handled this month'
  },
  {
    title: 'Avg Response Time',
    value: '1.2s',
    change: '-8.3%',
    changeType: 'positive' as const,
    icon: Clock,
    description: 'Average pickup time'
  },
  {
    title: 'Conversion Rate',
    value: '68.4%',
    change: '+4.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    description: 'Leads converted to appointments'
  },
  {
    title: 'Active Clients',
    value: '156',
    change: '+2.1%',
    changeType: 'positive' as const,
    icon: Users,
    description: 'Monthly active users'
  }
];

export const DashboardStats: React.FC = () => {
  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="group relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all duration-500 hover:shadow-[var(--premium-shadow-medium)] hover:-translate-y-1"
          style={{ 
            boxShadow: 'var(--premium-shadow-subtle)',
            background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
            border: '1px solid hsl(var(--premium-border))'
          }}
        >
          {/* Premium Glass Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          {/* Subtle Animation Delay */}
          <div 
            className="h-full animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-muted-foreground/80 tracking-wide uppercase">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/15 group-hover:to-primary/8 transition-all duration-300">
                <stat.icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors duration-300" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <div 
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stat.changeType === 'positive' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  {stat.change}
                </div>
                <span className="text-xs text-muted-foreground/70">vs last month</span>
              </div>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                {stat.description}
              </p>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
};