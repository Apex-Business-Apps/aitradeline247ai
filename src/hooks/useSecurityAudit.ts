import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string | null;
  session_id?: string | null;
  ip_address?: unknown;
  user_agent?: string | null;
  event_data: any;
  severity: string;
  created_at: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  warningEvents: number;
  recentActivity: SecurityEvent[];
  suspiciousPatterns: string[];
}

/**
 * Custom hook for security auditing and monitoring
 * Provides access to security events and metrics for admin users
 */
export const useSecurityAudit = () => {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    warningEvents: 0,
    recentActivity: [],
    suspiciousPatterns: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isAdmin } = useAuth();

  const fetchSecurityMetrics = async () => {
    if (!isAdmin()) {
      setError('Unauthorized: Admin access required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch recent security events (last 100)
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      // Calculate metrics
      const totalEvents = events?.length || 0;
      const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0;
      const warningEvents = events?.filter(e => e.severity === 'warning').length || 0;
      
      // Identify suspicious patterns
      const suspiciousPatterns: string[] = [];
      const eventTypes = events?.reduce((acc: Record<string, number>, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {}) || {};

      // Flag unusual activity patterns
      Object.entries(eventTypes).forEach(([type, count]) => {
        if (count > 10 && type.includes('error')) {
          suspiciousPatterns.push(`High error rate: ${type} (${count} occurrences)`);
        }
        if (count > 5 && type.includes('suspicious')) {
          suspiciousPatterns.push(`Repeated suspicious activity: ${type} (${count} occurrences)`);
        }
      });

      setSecurityMetrics({
        totalEvents,
        criticalEvents,
        warningEvents,
        recentActivity: events || [],
        suspiciousPatterns
      });

    } catch (err: any) {
      console.error('Failed to fetch security metrics:', err);
      setError(err.message || 'Failed to fetch security metrics');
    } finally {
      setLoading(false);
    }
  };

  const logSecurityEvent = async (
    eventType: string,
    eventData?: any,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ) => {
    try {
      await supabase.functions.invoke('secure-analytics', {
        body: {
          event_type: eventType,
          event_data: eventData || {},
          severity,
          session_id: sessionStorage.getItem('session_id') || undefined
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const generateSecurityReport = async (): Promise<string> => {
    if (!isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }

    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_events: securityMetrics.totalEvents,
        critical_events: securityMetrics.criticalEvents,
        warning_events: securityMetrics.warningEvents,
        suspicious_patterns: securityMetrics.suspiciousPatterns.length
      },
      recent_activity: securityMetrics.recentActivity.slice(0, 20),
      recommendations: [
        securityMetrics.criticalEvents > 0 ? 'Immediate attention required for critical security events' : null,
        securityMetrics.suspiciousPatterns.length > 3 ? 'Review suspicious activity patterns' : null,
        'Regular security audits recommended'
      ].filter(Boolean)
    };

    return JSON.stringify(report, null, 2);
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchSecurityMetrics();
      
      // Set up real-time subscription to security events
      const subscription = supabase
        .channel('security_events')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'analytics_events' },
          () => {
            fetchSecurityMetrics(); // Refresh metrics on new events
          }
        )
        .subscribe();

      // Refresh metrics every 5 minutes
      const interval = setInterval(fetchSecurityMetrics, 5 * 60 * 1000);

      return () => {
        subscription.unsubscribe();
        clearInterval(interval);
      };
    }
  }, [isAdmin]);

  return {
    securityMetrics,
    loading,
    error,
    fetchSecurityMetrics,
    logSecurityEvent,
    generateSecurityReport,
    isAdmin: isAdmin()
  };
};