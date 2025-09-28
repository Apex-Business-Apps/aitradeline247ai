import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { OutreachMessage } from '../lib/types';

interface MessageBubbleProps {
  message: OutreachMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'out';
  
  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
          isOutbound
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <div className="text-sm">{message.body || '(no content)'}</div>
        <div className={`text-xs mt-1 opacity-70`}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}