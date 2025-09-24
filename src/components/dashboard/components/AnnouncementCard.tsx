import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Announcement } from '@/types/dashboard';

interface AnnouncementCardProps {
  announcement: Announcement;
  onDismiss?: (announcementId: string) => void;
  onAction?: (announcementId: string, actionUrl?: string) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onDismiss,
  onAction
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-600 dark:text-green-400',
          titleColor: 'text-green-900 dark:text-green-100'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          titleColor: 'text-yellow-900 dark:text-yellow-100'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-red-900 dark:text-red-100'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600 dark:text-blue-400',
          titleColor: 'text-blue-900 dark:text-blue-100'
        };
    }
  };

  const config = getTypeConfig(announcement.type);
  const IconComponent = config.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.(announcement.id);
  };

  const handleAction = () => {
    onAction?.(announcement.id, announcement.actionUrl);
  };

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="shrink-0">
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${config.titleColor} mb-1`}>
              {announcement.title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {announcement.message}
            </p>
            
            {/* Action Button */}
            {announcement.actionText && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAction}
                className="mt-3 text-xs px-3 py-1 h-auto"
              >
                {announcement.actionText}
              </Button>
            )}
          </div>
          
          {/* Dismiss Button */}
          {announcement.dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="shrink-0 h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};