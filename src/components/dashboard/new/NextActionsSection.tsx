import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const upcomingActions = [
  {
    id: 'missed-calls',
    title: 'Follow up on missed calls',
    description: '3 potential customers called after hours',
    priority: 'high',
    action: 'Review & call back',
    icon: Phone
  },
  {
    id: 'review-conversations',
    title: 'Check conversation summaries',
    description: '12 new conversations from this week',
    priority: 'medium',
    action: 'Review summaries',
    icon: MessageSquare
  },
  {
    id: 'update-availability',
    title: 'Update your availability',
    description: 'Holiday schedule for next month',
    priority: 'low',
    action: 'Set schedule',
    icon: Users
  }
];

const recentWins = [
  'Sarah booked a consultation for tomorrow',
  'Mike rescheduled his appointment successfully',
  'New lead captured from website visitor'
];

export const NextActionsSection: React.FC = () => {
  return (
    <section className="grid gap-6 lg:grid-cols-2" data-testid="next-actions-section">
      {/* What's Next */}
      <Card 
        className="border-0"
        style={{ 
          boxShadow: 'var(--premium-shadow-subtle)',
          background: 'linear-gradient(135deg, hsl(var(--card) / 0.95) 0%, hsl(var(--card) / 0.9) 100%)'
        }}
        data-testid="next-actions-card"
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            What's next for you
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Simple actions to keep your business growing
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingActions.map((action) => (
            <div 
              key={action.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors group"
              data-testid={`action-item-${action.id}`}
            >
              <div className={`p-2 rounded-lg ${
                action.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                action.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <action.icon className={`h-4 w-4 ${
                  action.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                  action.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {action.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {action.description}
                </p>
              </div>
              
              <Button 
                size="sm" 
                variant="ghost"
                className="text-xs hover:bg-accent group-hover:text-primary transition-colors"
                data-testid={`action-button-${action.id}`}
              >
                {action.action}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Wins */}
      <Card 
        className="border-0"
        style={{ 
          boxShadow: 'var(--premium-shadow-subtle)',
          background: 'linear-gradient(135deg, hsl(var(--card) / 0.95) 0%, hsl(var(--card) / 0.9) 100%)'
        }}
        data-testid="recent-wins-card"
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Recent wins
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Good things happening with your AI receptionist
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentWins.map((win, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10"
              data-testid={`recent-win-${index}`}
            >
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">
                {win}
              </p>
            </div>
          ))}
          
          <div className="pt-3 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-sm hover:bg-accent"
              data-testid="view-all-activity-button"
            >
              View all activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};