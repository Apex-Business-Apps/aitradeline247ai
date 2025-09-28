import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  FileText, 
  Shield, 
  Download, 
  ExternalLink,
  Database,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface RetentionPolicy {
  recordings_days: number;
  transcripts_days: number;
  email_logs_days: number;
}

interface SystemStatus {
  status: 'operational' | 'maintenance' | 'incident';
  last_outage?: string;
}

export default function TrustPanel() {
  const { user } = useAuth();
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ status: 'operational' });
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrustData();
  }, []);

  const loadTrustData = async () => {
    try {
      // Load retention policies
      const { data: retentionData, error: retentionError } = await supabase
        .from('retention_policies')
        .select('recordings_days, transcripts_days, email_logs_days')
        .limit(1)
        .single();

      if (!retentionError && retentionData) {
        setRetentionPolicy(retentionData);
      } else {
        // Default values if no policy exists
        setRetentionPolicy({
          recordings_days: 30,
          transcripts_days: 90,
          email_logs_days: 180
        });
      }

      // Mock system status check
      // TODO: Replace with actual status API
      setSystemStatus({
        status: 'operational',
        last_outage: undefined
      });

    } catch (error) {
      console.error('Failed to load trust data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      // TODO: Implement actual data export
      // This should call POST /api/export and return 202 + email notification
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          user_id: user?.id,
          export_type: 'full_data'
        })
      });

      if (response.status === 202) {
        alert('Export requested! You will receive an email with your data export link within 24 hours.');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Data export failed:', error);
      alert('Export failed. Please contact support if this continues.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Data Retention</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {retentionPolicy?.recordings_days}
              </div>
              <div className="text-sm text-muted-foreground">
                Days for call recordings
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {retentionPolicy?.transcripts_days}
              </div>
              <div className="text-sm text-muted-foreground">
                Days for transcripts
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {retentionPolicy?.email_logs_days}
              </div>
              <div className="text-sm text-muted-foreground">
                Days for email logs
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Data is automatically deleted after the retention period to protect your privacy.
          </p>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Audit Trail</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Activity Logs</h4>
              <p className="text-sm text-muted-foreground">
                View detailed logs of all system activities and user actions
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/internal/audit/recent" target="_blank" className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Logs
              </a>
            </Button>
          </div>
          <Badge variant="outline" className="mt-2">
            Admin Access Required
          </Badge>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {systemStatus.status === 'operational' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">All Systems Operational</div>
                    <div className="text-sm text-muted-foreground">
                      {systemStatus.last_outage ? 
                        `Last outage: ${systemStatus.last_outage}` : 
                        'No recent outages'
                      }
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">System Status: {systemStatus.status}</div>
                    <div className="text-sm text-muted-foreground">
                      Check status page for details
                    </div>
                  </div>
                </>
              )}
            </div>
            <Button variant="outline" asChild>
              <a href="/status" target="_blank" className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Status Page
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Export My Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a complete copy of all your data. You'll receive an email with the download link.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Requesting...' : 'Export Data'}
            </Button>
          </div>
          <div className="mt-2">
            <Badge variant="secondary">
              Usually ready within 24 hours
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}