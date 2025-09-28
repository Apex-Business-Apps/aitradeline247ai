import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ConsentInfo } from '../lib/types';

interface ConsentBadgeProps {
  channel: string;
  consent?: ConsentInfo;
}

export function ConsentBadge({ channel, consent }: ConsentBadgeProps) {
  if (!consent || !consent.status) {
    return (
      <Badge variant="secondary" className="text-xs">
        {channel}: unknown
      </Badge>
    );
  }

  const variant = consent.status === 'opt_in' ? 'default' : 'destructive';
  
  return (
    <Badge variant={variant} className="text-xs">
      {channel}: {consent.status.replace('_', ' ')}
    </Badge>
  );
}