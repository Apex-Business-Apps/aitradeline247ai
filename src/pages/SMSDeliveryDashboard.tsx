import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DeliveryLog {
  id: string;
  message_sid: string;
  to_e164: string;
  from_e164: string;
  body_preview: string;
  status: string;
  status_updated_at: string;
  error_code: string | null;
  error_message: string | null;
  price: number | null;
  num_segments: number | null;
  created_at: string;
}

interface DeliveryStats {
  total_messages: number;
  delivered: number;
  failed: number;
  pending: number;
  delivery_rate: number;
  common_errors: Array<{
    error_code: string;
    count: number;
    sample_message: string;
  }>;
}

const ERROR_CODE_DESCRIPTIONS: Record<string, string> = {
  '30003': 'Unreachable destination handset',
  '30004': 'Message blocked by carrier',
  '30005': 'Unknown destination handset',
  '30006': 'Landline or unreachable carrier',
  '30007': 'Carrier violation or filtering',
  '30008': 'Unknown error',
  '30009': 'Missing segment',
  '30010': 'Message price exceeds max price'
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'failed':
    case 'undelivered':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'sent':
    case 'sending':
    case 'queued':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
    'delivered': 'default',
    'failed': 'destructive',
    'undelivered': 'destructive',
    'sent': 'secondary',
    'sending': 'secondary',
    'queued': 'outline'
  };
  
  return (
    <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
      {getStatusIcon(status)}
      {status.toUpperCase()}
    </Badge>
  );
};

export default function SMSDeliveryDashboard() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Real-time subscription for new delivery updates
    const channel = supabase
      .channel('sms-delivery-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sms_delivery_log'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch delivery logs (last 24 hours)
    const { data: logsData, error: logsError } = await supabase
      .from('sms_delivery_log')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (logsError) {
      console.error('Error fetching logs:', logsError);
    } else {
      setLogs(logsData || []);
    }

    // Fetch statistics
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_sms_delivery_stats', { hours_ago: 24 });

    if (statsError) {
      console.error('Error fetching stats:', statsError);
    } else if (statsData && statsData.length > 0) {
      const rawStats = statsData[0];
      setStats({
        ...rawStats,
        common_errors: Array.isArray(rawStats.common_errors) 
          ? rawStats.common_errors as Array<{ error_code: string; count: number; sample_message: string }>
          : []
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">Loading delivery data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">SMS Delivery Dashboard</h1>
        <p className="text-muted-foreground">Last 24 hours of message delivery status</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Messages</div>
          <div className="text-2xl font-bold">{stats?.total_messages || 0}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Delivered</div>
          <div className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Delivery Rate</div>
          <div className="text-2xl font-bold">{stats?.delivery_rate || 0}%</div>
        </Card>
      </div>

      {/* Common Errors */}
      {stats?.common_errors && stats.common_errors.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Common Errors (Last 24h)</h2>
          <div className="space-y-2">
            {stats.common_errors.map((error, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Badge variant="destructive">{error.error_code}</Badge>
                <div className="flex-1">
                  <div className="font-medium">
                    {ERROR_CODE_DESCRIPTIONS[error.error_code] || 'Unknown error'}
                  </div>
                  <div className="text-sm text-muted-foreground">{error.sample_message}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {error.count} occurrence{error.count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Delivery Log Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Deliveries</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Message SID</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No delivery logs found in the last 24 hours
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="font-mono text-sm">{log.to_e164}</TableCell>
                    <TableCell className="font-mono text-xs">{log.message_sid}</TableCell>
                    <TableCell>
                      {log.error_code ? (
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-red-600">
                            {log.error_code}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {ERROR_CODE_DESCRIPTIONS[log.error_code] || log.error_message}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.price ? (
                        <span className="text-sm">${log.price.toFixed(4)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

