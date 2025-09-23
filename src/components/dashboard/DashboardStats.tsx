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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="flex items-center space-x-2 text-xs">
              <span 
                className={`font-medium ${
                  stat.changeType === 'positive' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};