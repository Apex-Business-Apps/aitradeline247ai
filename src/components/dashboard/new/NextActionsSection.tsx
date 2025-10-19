import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NextItem } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';

interface NextActionsSectionProps {
  nextItems?: NextItem[];
  isLoading?: boolean;
}

export const NextActionsSection: React.FC<NextActionsSectionProps> = ({ 
  nextItems = [], 
  isLoading = false 
}) => {
  
  const handleAction = (itemId: string, action: string) => {
    console.log('Action triggered:', { itemId, action });
  };
  
  return (
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
      <CardContent>
        <div className="text-xs text-muted-foreground/80 mb-3">
          Tap to confirm or move an appointment.
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                <div className="flex items-center space-x-3 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : nextItems.length > 0 ? (
          <div className="space-y-3">
            {nextItems.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 bg-card/50 rounded-lg border hover:bg-card/70 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.contact}</p>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(item.whenISO).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {item.actions.map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(item.id, action)}
                      className="text-xs"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground/70 py-6">
            Nothing queued right now.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
