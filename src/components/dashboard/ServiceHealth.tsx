import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  lastCheck: Date;
}

export const ServiceHealth: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Supabase', status: 'operational', lastCheck: new Date() },
    { name: 'Twilio', status: 'operational', lastCheck: new Date() }
  ]);

  useEffect(() => {
    const checkHealth = async () => {
      const now = new Date();
      const updated: ServiceStatus[] = [];

      // Check Supabase connectivity
      try {
        const { error } = await supabase.from('analytics_events').select('id').limit(1);
        updated.push({
          name: 'Supabase',
          status: error ? 'down' : 'operational',
          lastCheck: now
        });
      } catch {
        updated.push({ name: 'Supabase', status: 'down', lastCheck: now });
      }

      // Check Twilio via recent call events
      try {
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const { data, error } = await supabase
          .from('analytics_events')
          .select('id')
          .eq('event_type', 'voice_call_incoming')
          .gte('created_at', fiveMinutesAgo.toISOString())
          .limit(1);

        // If we have recent events or no error, Twilio is operational
        updated.push({
          name: 'Twilio',
          status: (!error && data) ? 'operational' : 'degraded',
          lastCheck: now
        });
      } catch {
        updated.push({ name: 'Twilio', status: 'degraded', lastCheck: now });
      }

      setServices(updated);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const allOperational = services.every(s => s.status === 'operational');
  const hasCritical = services.some(s => s.status === 'down');

  const getStatusIcon = (status: string) => {
    if (status === 'operational') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'down') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <Card className={`${allOperational ? 'border-green-200 dark:border-green-800' : hasCritical ? 'border-red-200 dark:border-red-800' : 'border-yellow-200 dark:border-yellow-800'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Service Health</h3>
          {allOperational ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs">All systems operational</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-xs">Service issues detected</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {services.map(service => (
            <div key={service.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                <span className="text-muted-foreground">{service.name}</span>
              </div>
              <span className={`text-xs ${
                service.status === 'operational' ? 'text-green-600 dark:text-green-400' :
                service.status === 'down' ? 'text-red-600 dark:text-red-400' :
                'text-yellow-600 dark:text-yellow-400'
              }`}>
                {service.status === 'operational' ? 'Online' : 
                 service.status === 'down' ? 'Offline' : 'Degraded'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
