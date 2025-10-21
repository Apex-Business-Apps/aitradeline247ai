import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SecurityDashboardData {
  failed_auth: {
    total_failures: number;
    unique_ips: number;
    unique_users: number;
    top_ip: string;
    recent_failures: any[];
  };
  rate_limits: {
    hotline_ani_blocks: number;
    hotline_ip_blocks: number;
    support_ticket_limits: number;
    active_blocks: number;
  };
  pii_access: {
    total_accesses: number;
    unique_users: number;
    by_access_type: Record<string, number>;
    by_table: Record<string, number>;
    recent_accesses: any[];
  };
  security_alerts: {
    total_alerts: number;
    critical_alerts: number;
    high_alerts: number;
    unresolved_alerts: number;
    by_type: Record<string, number>;
    recent_alerts: any[];
  };
  generated_at: string;
}

export const useSecurityMonitoring = () => {
  return useQuery({
    queryKey: ['security-monitoring'],
    queryFn: async (): Promise<SecurityDashboardData> => {
      const { data, error } = await supabase.rpc('get_security_dashboard_data');
      
      if (error) {
        console.error('Security monitoring error:', error);
        throw error;
      }
      
      return data as unknown as SecurityDashboardData;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

