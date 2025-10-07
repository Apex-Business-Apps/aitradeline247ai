import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Phone, Settings, Download, MessageSquare } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  icon: any;
}

export function useRecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recent audit logs
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('ts', { ascending: false })
        .limit(10);

      if (auditError) throw auditError;

      // Transform audit logs into activity items
      const formattedActivities: ActivityItem[] = (auditLogs || []).map((log) => {
        const timeAgo = formatTimeAgo(log.ts);
        
        return {
          id: log.id,
          type: mapActionToType(log.action),
          title: formatActivityTitle(log.action, log.target),
          description: formatActivityDescription(log),
          time: timeAgo,
          icon: getActivityIcon(log.action)
        };
      });

      setActivities(formattedActivities);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  };

  return { activities, isLoading, error, refresh: fetchRecentActivity };
}

function mapActionToType(action: string): string {
  if (action.includes('call')) return 'call';
  if (action.includes('config') || action.includes('update') || action.includes('settings')) return 'config';
  if (action.includes('export') || action.includes('download')) return 'export';
  if (action.includes('support') || action.includes('ticket')) return 'support';
  return 'activity';
}

function formatActivityTitle(action: string, target?: string): string {
  const actionMap: Record<string, string> = {
    'call_completed': 'Call completed',
    'call_missed': 'Missed call',
    'settings_updated': 'Settings updated',
    'export_report': 'Report downloaded',
    'ticket_created': 'Support ticket created',
    'appointment_created': 'Appointment scheduled',
    'appointment_updated': 'Appointment updated'
  };
  
  return actionMap[action] || `${action.replace(/_/g, ' ')} ${target || ''}`.trim();
}

function formatActivityDescription(log: any): string {
  if (log.payload) {
    const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
    if (payload.description) return payload.description;
    if (payload.details) return payload.details;
  }
  
  return `Action: ${log.action}`;
}

function getActivityIcon(action: string) {
  if (action.includes('call')) return Phone;
  if (action.includes('config') || action.includes('settings')) return Settings;
  if (action.includes('export') || action.includes('download')) return Download;
  if (action.includes('support') || action.includes('ticket')) return MessageSquare;
  return Activity;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
