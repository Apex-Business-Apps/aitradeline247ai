import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceCheck {
  check_name: string;
  status: 'passed' | 'failed' | 'warning';
  description?: string;
  manual_action_required?: boolean;
  remediation_notes?: string;
}

export const useSecurityCompliance = () => {
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Run comprehensive security compliance checks
  const runComplianceCheck = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const checks: ComplianceCheck[] = [];

      // Check RLS on sensitive tables
      const { data: rlsTables } = await supabase
        .rpc('validate_security_post_upgrade');
      
      if (rlsTables) {
        const validationData = rlsTables as any; // Type assertion for database response
        checks.push({
          check_name: 'RLS_ENABLED_TABLES',
          status: validationData.rls_enabled_tables > 0 ? 'passed' : 'failed',
          description: `${validationData.rls_enabled_tables || 0} tables have RLS enabled`,
          manual_action_required: validationData.rls_enabled_tables === 0
        });

        checks.push({
          check_name: 'SECURITY_DEFINER_FUNCTIONS',
          status: validationData.security_definer_functions > 5 ? 'passed' : 'warning',
          description: `${validationData.security_definer_functions || 0} security definer functions configured`,
          manual_action_required: false
        });

        checks.push({
          check_name: 'RLS_POLICIES',
          status: validationData.rls_policies > 10 ? 'passed' : 'warning',
          description: `${validationData.rls_policies || 0} RLS policies active`,
          manual_action_required: validationData.rls_policies < 5
        });
      }

      // Check for recent security alerts
      const { data: recentAlerts } = await supabase
        .from('security_alerts')
        .select('severity, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentAlerts) {
        const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical').length;
        const highAlerts = recentAlerts.filter(alert => alert.severity === 'high').length;
        
        checks.push({
          check_name: 'RECENT_SECURITY_ALERTS',
          status: criticalAlerts === 0 && highAlerts < 3 ? 'passed' : criticalAlerts > 0 ? 'failed' : 'warning',
          description: `${criticalAlerts} critical, ${highAlerts} high severity alerts in last 24h`,
          manual_action_required: criticalAlerts > 0,
          remediation_notes: criticalAlerts > 0 ? 'Investigate critical security alerts immediately' : undefined
        });
      }

      // Check audit trail functionality
      const { data: auditLogs } = await supabase
        .from('data_access_audit')
        .select('access_type')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(1);

      checks.push({
        check_name: 'AUDIT_LOGGING',
        status: auditLogs && auditLogs.length > 0 ? 'passed' : 'warning',
        description: auditLogs && auditLogs.length > 0 ? 'Audit logging is active' : 'No recent audit logs found',
        manual_action_required: false
      });

      // Update compliance table
      for (const check of checks) {
        await supabase
          .from('security_compliance')
          .upsert({
            check_name: check.check_name,
            status: check.status,
            description: check.description,
            manual_action_required: check.manual_action_required || false,
            remediation_notes: check.remediation_notes,
            last_checked: new Date().toISOString()
          });
      }

      setComplianceChecks(checks);
    } catch (error) {
      console.error('Compliance check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get compliance status
  const getComplianceStatus = useCallback(async () => {
    try {
      const { data: compliance } = await supabase
        .from('security_compliance')
        .select('*')
        .order('last_checked', { ascending: false });

      if (compliance) {
        const typedCompliance = compliance.map(item => ({
          check_name: item.check_name,
          status: (item.status as 'passed' | 'failed' | 'warning') || 'warning',
          description: item.description,
          manual_action_required: item.manual_action_required,
          remediation_notes: item.remediation_notes
        }));
        setComplianceChecks(typedCompliance);
      }
    } catch (error) {
      console.error('Failed to get compliance status:', error);
    }
  }, []);

  // Log security compliance event
  const logComplianceEvent = useCallback(async (eventType: string, details?: any) => {
    try {
      await supabase.functions.invoke('secure-analytics', {
        body: {
          event_type: `compliance_${eventType}`,
          event_data: {
            timestamp: new Date().toISOString(),
            details: details || {},
            compliance_check: true
          }
        }
      });
    } catch (error) {
      console.error('Failed to log compliance event:', error);
    }
  }, []);

  return {
    complianceChecks,
    isLoading,
    runComplianceCheck,
    getComplianceStatus,
    logComplianceEvent
  };
};
