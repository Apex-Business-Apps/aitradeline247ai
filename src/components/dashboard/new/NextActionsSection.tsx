import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const todaysAppointments = [
  {
    id: 'appt-1',
    time: '10:30 AM',
    client: 'Sarah Johnson',
    type: 'Consultation',
    status: 'confirmed',
    actions: ['Confirm', 'Reschedule', 'Add note']
  },
  {
    id: 'appt-2',
    time: '2:00 PM',
    client: 'Mike Chen',
    type: 'Follow-up',
    status: 'pending',
    actions: ['Confirm', 'Reschedule', 'Add note']
  },
  {
    id: 'appt-3',
    time: '4:15 PM',
    client: 'Emma Davis',
    type: 'New client',
    status: 'tentative',
    actions: ['Confirm', 'Reschedule', 'Add note']
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
            Today's appointments
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upcoming calls and meetings
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysAppointments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">Nothing queued right now.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground/80 mb-3">Tap to confirm or move an appointment.</p>
              {todaysAppointments.map((appointment) => (
            <div 
              key={appointment.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 border border-border/50"
              data-testid={`appointment-${appointment.id}`}
            >
              <div className="flex-shrink-0">
                <div className="text-sm font-medium text-foreground">
                  {appointment.time}
                </div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  appointment.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                  appointment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}>
                  {appointment.status}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {appointment.client}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appointment.type}
                </p>
              </div>
              
              <div className="flex gap-1">
                {appointment.actions.slice(0, 2).map((action) => (
                  <Button 
                    key={action}
                    size="sm" 
                    variant="ghost"
                    className="text-xs px-2"
                    data-testid={`action-${appointment.id}-${action.toLowerCase().replace(' ', '-')}`}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
              ))}
            </>
          )}
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
          {recentWins.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm">We'll drop new call notes here. Check back soon.</p>
            </div>
          ) : (
            recentWins.map((win, index) => (
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
            ))
          )}
          
          {recentWins.length > 0 && (
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
          )}
        </CardContent>
      </Card>
    </section>
  );
};