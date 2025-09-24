import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NextItem } from '@/types/dashboard';
import { NextItemRow } from '../components/NextItemRow';
import { Skeleton } from '@/components/ui/skeleton';

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
    // TODO: Implement real action handling
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
              <NextItemRow 
                key={item.id} 
                item={item} 
                onAction={handleAction}
              />
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