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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Phone className="h-5 w-5" />
          <span>Recent Calls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentCalls.map((call) => (
          <div key={call.id} className="flex items-center justify-between space-x-3 p-3 rounded-lg bg-muted/30">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {call.caller}
                </p>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(call.status)}`}
                >
                  {call.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <span>{call.time}</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{call.duration}</span>
                </div>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${getTypeColor(call.type)}`}
            >
              {call.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};