import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Mail, Clock } from 'lucide-react';
import { NextItem } from '@/types/dashboard';

interface NextItemRowProps {
  item: NextItem;
  onAction?: (itemId: string, action: string) => void;
}

export const NextItemRow: React.FC<NextItemRowProps> = ({ item, onAction }) => {
  const formatDateTime = (isoString: string): { date: string; time: string } => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'reschedule':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getContactIcon = (contact: string) => {
    return contact.includes('@') ? Mail : Phone;
  };

  const { date, time } = formatDateTime(item.whenISO);
  const ContactIcon = getContactIcon(item.contact);

  return (
    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Date/Time */}
        <div className="flex items-center space-x-1 text-xs text-muted-foreground min-w-0">
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="font-medium">{date}</span>
          <Clock className="h-3 w-3 shrink-0 ml-1" />
          <span>{time}</span>
        </div>
        
        {/* Contact Info */}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div>
            <div className="font-medium text-sm text-foreground truncate">
              {item.name}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ContactIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.contact}</span>
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
          {item.status}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center space-x-1 ml-3">
        {item.actions.map((action) => (
          <Button
            key={action}
            variant="outline"
            size="sm"
            onClick={() => onAction?.(item.id, action)}
            className="text-xs px-2 py-1 h-auto"
          >
            {action}
          </Button>
        ))}
      </div>
    </div>
  );
};