import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, RotateCcw, X } from 'lucide-react';
import type { OutreachSession } from '../lib/types';

interface SessionTableProps {
  sessions: OutreachSession[];
  onViewSession: (session: OutreachSession) => void;
  onResendInitial: (sessionId: string) => void;
  onCancelSession: (sessionId: string) => void;
  onFilterChange: (filters: { state?: string; e164?: string }) => void;
}

export function SessionTable({
  sessions,
  onViewSession,
  onResendInitial,
  onCancelSession,
  onFilterChange
}: SessionTableProps) {
  const [stateFilter, setStateFilter] = useState<string>('');
  const [e164Filter, setE164Filter] = useState<string>('');

  const handleStateChange = (value: string) => {
    setStateFilter(value);
    onFilterChange({ state: value || undefined, e164: e164Filter || undefined });
  };

  const handleE164Change = (value: string) => {
    setE164Filter(value);
    onFilterChange({ state: stateFilter || undefined, e164: value || undefined });
  };

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case 'pending': return 'secondary';
      case 'sent': return 'default';
      case 'responded': return 'default';
      case 'expired': return 'destructive';
      case 'stopped': return 'outline';
      default: return 'secondary';
    }
  };

  const getChannelIcon = (channel: string | null) => {
    if (channel === 'whatsapp') return '📱';
    if (channel === 'sms') return '💬';
    return '❓';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Filter by phone number..."
            value={e164Filter}
            onChange={(e) => handleE164Change(e.target.value)}
            data-testid="filter-e164"
            className="min-h-[44px]"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={stateFilter} onValueChange={handleStateChange}>
            <SelectTrigger data-testid="filter-state" className="min-h-[44px]">
              <SelectValue placeholder="Filter by state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All states</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="sessions-table">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Channel</th>
                <th className="px-4 py-3 text-left text-sm font-medium">State</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Last Sent</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Follow-up Due</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {session.e164}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1">
                      {getChannelIcon(session.channel)}
                      {session.channel || 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={getStateBadgeVariant(session.state)}>
                      {session.state}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {session.lastSentAt
                      ? formatDistanceToNow(new Date(session.lastSentAt), { addSuffix: true })
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {session.followupDueAt
                      ? formatDistanceToNow(new Date(session.followupDueAt), { addSuffix: true })
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewSession(session)}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View session</span>
                      </Button>
                      {(session.state === 'pending' || session.state === 'sent') && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onResendInitial(session.id)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Resend initial</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onCancelSession(session.id)}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cancel session</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sessions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No sessions found
          </div>
        )}
      </div>
    </div>
  );
}