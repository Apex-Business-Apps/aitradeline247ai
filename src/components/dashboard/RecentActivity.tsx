import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Phone, Settings, Download, MessageSquare } from 'lucide-react';

const activities = [
  {
    id: '1',
    type: 'call',
    title: 'Call completed with John Smith',
    description: 'Appointment scheduled for tomorrow at 2:00 PM',
    time: '5 minutes ago',
    icon: Phone
  },
  {
    id: '2',
    type: 'config',
    title: 'AI settings updated',
    description: 'Modified greeting message and call routing',
    time: '1 hour ago',
    icon: Settings
  },
  {
    id: '3',
    type: 'export',
    title: 'Monthly report downloaded',
    description: 'Call analytics for November 2024',
    time: '3 hours ago',
    icon: Download
  },
  {
    id: '4',
    type: 'support',
    title: 'Support ticket created',
    description: 'Issue with call forwarding resolved',
    time: '6 hours ago',
    icon: MessageSquare
  },
  {
    id: '5',
    type: 'call',
    title: 'Peak hours alert',
    description: 'High call volume detected between 10-11 AM',
    time: '1 day ago',
    icon: Activity
  }
];

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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};