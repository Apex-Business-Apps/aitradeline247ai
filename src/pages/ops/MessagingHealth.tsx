import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface A2PStatus {
  brand_sid: string | null;
  campaign_sid: string | null;
  messaging_service_sid: string | null;
  a2p_status: string | null;
  us_enabled: boolean;
  last_delivery_receipt?: string;
  delivery_rate?: number;
  avg_callback_ms?: number;
}

const MessagingHealth = () => {
  const [loading, setLoading] = useState(true);
  const [a2pStatus, setA2pStatus] = useState<A2PStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadA2PStatus();
    const interval = setInterval(loadA2PStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadA2PStatus = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('messaging_compliance')
        .select('*')
        .eq('us_enabled', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;
      
      setA2pStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error loading A2P status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load A2P status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Not Configured</Badge>;
    
    switch (status.toLowerCase()) {
      case 'verified':
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDeliveryRateBadge = (rate: number | undefined) => {
    if (!rate) return <Badge variant="secondary">No Data</Badge>;
    if (rate >= 98) return <Badge className="bg-green-500">{rate}%</Badge>;
    if (rate >= 95) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{rate}%</Badge>;
    return <Badge variant="destructive">{rate}%</Badge>;
  };

  const getCallbackTimeBadge = (ms: number | undefined) => {
    if (!ms) return <Badge variant="secondary">No Data</Badge>;
    if (ms < 500) return <Badge className="bg-green-500">{ms}ms</Badge>;
    if (ms < 1000) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{ms}ms</Badge>;
    return <Badge variant="destructive">{ms}ms</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading messaging health data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Messaging Health</h1>
          <p className="text-muted-foreground">
            Monitor A2P 10DLC compliance, delivery rates, and SMS performance
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Error Loading Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {!a2pStatus?.us_enabled && (
          <Card className="mb-6 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-500" />
                US Messaging Not Enabled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This organization is configured for Canada-only messaging. US A2P 10DLC is not required.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* A2P Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">A2P 10DLC Status</CardTitle>
              <CardDescription>Brand & Campaign Verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Status</p>
                {getStatusBadge(a2pStatus?.a2p_status || null)}
              </div>
              
              {a2pStatus?.brand_sid && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Brand SID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{a2pStatus.brand_sid}</code>
                </div>
              )}
              
              {a2pStatus?.campaign_sid && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Campaign SID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{a2pStatus.campaign_sid}</code>
                </div>
              )}
              
              {a2pStatus?.messaging_service_sid && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Messaging Service</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{a2pStatus.messaging_service_sid}</code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Performance</CardTitle>
              <CardDescription>Last 24 Hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivery Rate</p>
                <div className="text-2xl font-bold">
                  {getDeliveryRateBadge(a2pStatus?.delivery_rate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Target: ≥98%</p>
              </div>
              
              {a2pStatus?.last_delivery_receipt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Receipt</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                    {a2pStatus.last_delivery_receipt}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Callback Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Callback Performance</CardTitle>
              <CardDescription>Status Webhook Latency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Callback Time</p>
                <div className="text-2xl font-bold">
                  {getCallbackTimeBadge(a2pStatus?.avg_callback_ms)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Target: &lt;500ms</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Samples Section */}
        {a2pStatus?.us_enabled && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Compliance Samples</CardTitle>
              <CardDescription>Opt-in, HELP, and STOP message templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Sample Opt-in Message:</p>
                <p className="text-sm bg-muted p-3 rounded">
                  "Reply YES to receive updates from [Business Name]. Msg&Data rates may apply. Text STOP to unsubscribe, HELP for help."
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Sample HELP Response:</p>
                <p className="text-sm bg-muted p-3 rounded">
                  "For support, contact us at +1-587-742-8885 or info@tradeline247ai.com. Text STOP to unsubscribe."
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Sample STOP Response:</p>
                <p className="text-sm bg-muted p-3 rounded">
                  "You've been unsubscribed and will receive no further messages from this number. Reply START to resubscribe."
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentation Links */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="https://www.twilio.com/docs/sms/a2p-10dlc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-sm text-primary hover:underline"
            >
              📚 Twilio A2P 10DLC Documentation
            </a>
            <a 
              href="https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/editor/messaging_compliance" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-sm text-primary hover:underline"
            >
              🗄️ View Compliance Records
            </a>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MessagingHealth;
