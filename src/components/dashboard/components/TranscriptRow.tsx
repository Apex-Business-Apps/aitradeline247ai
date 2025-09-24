import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Clock } from 'lucide-react';
import { Transcript } from '@/types/dashboard';

interface TranscriptRowProps {
  transcript: Transcript;
  onReply?: (transcriptId: string) => void;
}

export const TranscriptRow: React.FC<TranscriptRowProps> = ({ 
  transcript, 
  onReply 
}) => {
  const formatTimeAgo = (isoString: string): string => {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😔';
      default:
        return '😐';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-card/50 rounded-lg border border-border/50">
      {/* Call Icon */}
      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
        <Phone className="h-4 w-4 text-primary" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm text-foreground">
              {transcript.caller}
            </span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(transcript.sentiment)}`}>
              {getSentimentEmoji(transcript.sentiment)} {transcript.sentiment}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTimeAgo(transcript.atISO)}</span>
          </div>
        </div>
        
        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {transcript.summary}
        </p>
        
        {/* Action */}
        {transcript.needsReply && (
          <div className="flex items-center justify-between pt-1">
            <Badge variant="secondary" className="text-xs">
              Needs reply
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onReply?.(transcript.id)}
              className="text-xs px-3 py-1 h-auto"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};