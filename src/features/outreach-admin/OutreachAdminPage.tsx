import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play } from 'lucide-react';
import { SessionTable } from './components/SessionTable';
import { SessionDetailDrawer } from './components/SessionDetailDrawer';
import { fetchSessions, runFollowups } from './lib/api';
import type { OutreachSession } from './lib/types';

export function OutreachAdminPage() {
  const [sessions, setSessions] = useState<OutreachSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [followupsLoading, setFollowupsLoading] = useState(false);
  const [filters, setFilters] = useState<{ state?: string; e164?: string }>({});

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await fetchSessions({
        ...filters,
        limit: 100
      });
      setSessions(data.items);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunFollowups = async () => {
    setFollowupsLoading(true);
    try {
      const result = await runFollowups();
      console.log(`Sent ${result.sent} followup messages`);
      loadSessions(); // Refresh the list
    } catch (error) {
      console.error('Failed to run followups:', error);
    } finally {
      setFollowupsLoading(false);
    }
  };

  const handleViewSession = (session: OutreachSession) => {
    setSelectedSessionId(session.id);
  };

  const handleCloseDrawer = () => {
    setSelectedSessionId(null);
  };

  const handleSessionAction = () => {
    loadSessions(); // Refresh the list when any action is performed
  };

  const handleResendInitial = async (sessionId: string) => {
    try {
      // The actual API call will be handled by the drawer
      // We just need to refresh the list
      loadSessions();
    } catch (error) {
      console.error('Failed to resend initial:', error);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      // The actual API call will be handled by the drawer
      // We just need to refresh the list
      loadSessions();
    } catch (error) {
      console.error('Failed to cancel session:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Outreach Administration</h1>
          <p className="text-muted-foreground">
            Manage outreach sessions and follow-up communications
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunFollowups}
            disabled={followupsLoading}
            data-testid="action-run-followups"
            className="min-h-[44px]"
          >
            <Play className="h-4 w-4 mr-2" />
            {followupsLoading ? 'Running...' : 'Run Followups'}
          </Button>
          
          <Button
            variant="outline"
            onClick={loadSessions}
            disabled={loading}
            className="min-h-[44px]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <SessionTable
        sessions={sessions}
        onViewSession={handleViewSession}
        onResendInitial={handleResendInitial}
        onCancelSession={handleCancelSession}
        onFilterChange={setFilters}
      />

      <SessionDetailDrawer
        sessionId={selectedSessionId}
        onClose={handleCloseDrawer}
        onAction={handleSessionAction}
      />
    </div>
  );
}