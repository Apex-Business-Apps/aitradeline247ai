import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Download, MessageSquare, BarChart3 } from 'lucide-react';

const actions = [
  {
    title: 'Configure AI',
    description: 'Customize your AI receptionist settings',
    icon: Settings,
    variant: 'default' as const
  },
  {
    title: 'View Reports',
    description: 'Download detailed analytics',
    icon: BarChart3,
    variant: 'secondary' as const
  },
  {
    title: 'Export Data',
    description: 'Download call logs and transcripts',
    icon: Download,
    variant: 'outline' as const
  },
  {
    title: 'Live Chat',
    description: 'Chat with our support team',
    icon: MessageSquare,
    variant: 'outline' as const
  }
];

export const QuickActions: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant={action.variant}
            className="w-full h-auto p-3 sm:p-4 justify-start min-h-[3rem] touch-manipulation"
            asChild
          >
            <div className="flex items-start space-x-2 sm:space-x-3">
              <action.icon className="h-4 w-4 sm:h-5 sm:w-5 mt-1 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="font-medium text-sm sm:text-base truncate">{action.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {action.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};