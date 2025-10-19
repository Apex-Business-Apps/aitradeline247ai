import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { QuickActionItem } from '@/types/dashboard';

interface QuickActionProps {
  action: QuickActionItem;
  icon: LucideIcon;
  onClick?: (actionId: string) => void;
  className?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({ 
  action, 
  icon: Icon,
  onClick,
  className = ""
}) => {
  return (
    <Button
      variant={action.variant || "outline"}
      onClick={() => onClick?.(action.id)}
      className={`h-auto p-4 flex flex-col items-center space-y-2 text-center ${className}`}
    >
      <div className="p-3 bg-primary/10 rounded-lg">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <div className="font-medium text-sm">
          {action.title}
        </div>
        <div className="text-xs text-muted-foreground leading-tight">
          {action.description}
        </div>
      </div>
    </Button>
  );
};
