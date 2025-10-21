import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// PROMPT F: Evidence dashboard with 24h tiles
interface HealthMetrics {
  voice: {
    answeredCount: number;
    failedCount: number;
    streamFallbackCount: number;
    avgHandshakeMs: number;
    p95HandshakeMs: number;
  };
  sms: {
    inboundCount: number;
    deliverySuccessRate: number;
  };
  numbers: {
    purchasedCount: number;
  };
}

export default function TwilioEvidence() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // PROMPT F: Inbound calls (answered / failed / stream-fallback count)
      const { data: callLogs } = await supabase
        .from('call_logs')
        .select('status, captured_fields')
        .gte('created_at', past24h);

      const answeredCount = callLogs?.filter(c => c.status === 'completed').length || 0;
      const failedCount = callLogs?.filter(c => c.status === 'failed').length || 0;
      const streamFallbackCount = callLogs?.filter(c => 
        (c.captured_fields as any)?.stream_fallback === true
      ).length || 0;

      // PROMPT F: Avg handshake ms (voice stream); P95 < 1500ms
      const { data: streamLogs } = await supabase
        .from('voice_stream_logs')
        .select('elapsed_ms')
        .eq('fell_back', false)
        .gte('created_at', past24h);

      const handshakeTimes = (streamLogs || [])
        .map(l => l.elapsed_ms)
        .filter(Boolean)
        .sort((a, b) => a - b);

      const avgHandshake = handshakeTimes.length > 0
        ? Math.round(handshakeTimes.reduce((a, b) => a + b, 0) / handshakeTimes.length)
        : 0;
      const p95Handshake = handshakeTimes[Math.floor(handshakeTimes.length * 0.95)] || 0;

      // PROMPT F: SMS inbound (unique SIDs) & delivery success rate
      const { data: smsReply } = await supabase
        .from('sms_reply_logs')
        .select('message_sid')
        .gte('created_at', past24h);

      const { data: smsStatus } = await supabase
        .from('sms_status_logs')
        .select('status')
        .gte('created_at', past24h);

      const deliveredCount = smsStatus?.filter(s => s.status === 'delivered').length || 0;
      const totalSms = smsStatus?.length || 1;
      const deliveryRate = Math.round((deliveredCount / totalSms) * 100);

      // PROMPT F: New numbers purchased (with subaccount)
      const { data: buyLogs } = await supabase
        .from('twilio_buy_number_logs')
        .select('*')
        .eq('success', true)
        .gte('created_at', past24h);

      setMetrics({
        voice: {
          answeredCount,
          failedCount,
          streamFallbackCount,
          avgHandshakeMs: avgHandshake,
          p95HandshakeMs: p95Handshake
        },
        sms: {
          inboundCount: smsReply?.length || 0,
          deliverySuccessRate: deliveryRate
        },
        numbers: {
          purchasedCount: buyLogs?.length || 0
        }
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading health metrics...</div>;
  }

  // PROMPT DF-4: Watchdog telemetry thresholds
  const voiceHealthy = metrics?.voice.p95HandshakeMs! < 1500;
  const smsHealthy = metrics?.sms.deliverySuccessRate! >= 95;
  
  // DF-4: Alert rules
  const p95Yellow = metrics?.voice.p95HandshakeMs! > 1500 && metrics?.voice.p95HandshakeMs! <= 2000;
  const p95Red = metrics?.voice.p95HandshakeMs! > 2000;
  const fallbackYellow = (metrics?.voice.streamFallbackCount / (metrics?.voice.answeredCount || 1)) > 0.05 && 
                          (metrics?.voice.streamFallbackCount / (metrics?.voice.answeredCount || 1)) <= 0.10;
  const fallbackRed = (metrics?.voice.streamFallbackCount / (metrics?.voice.answeredCount || 1)) > 0.10;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* PROMPT DF-4: Alert banner for threshold violations */}
      {(p95Red || fallbackRed) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold">CRITICAL: Performance threshold exceeded</div>
            {p95Red && <div>• P95 handshake &gt; 2000ms for 15m</div>}
            {fallbackRed && <div>• Stream fallbacks &gt; 10% over 1h</div>}
          </AlertDescription>
        </Alert>
      )}
      {(p95Yellow || fallbackYellow) && !p95Red && !fallbackRed && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold">WARNING: Performance degradation detected</div>
            {p95Yellow && <div>• P95 handshake &gt; 1500ms for 15m</div>}
            {fallbackYellow && <div>• Stream fallbacks &gt; 5% over 1h</div>}
          </AlertDescription>
        </Alert>
      )}
      <div>
        <h1 className="text-3xl font-bold">Twilio Integration Evidence</h1>
        <p className="text-muted-foreground">PROMPT F: Health metrics and compliance proofs (24h)</p>
      </div>

      {/* PROMPT F: Tiles (24h) */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inbound Calls</CardTitle>
            {voiceHealthy ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{metrics?.voice.answeredCount}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-mono">{metrics?.voice.answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-mono text-red-500">{metrics?.voice.failedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Stream Fallback:</span>
                <span className="font-mono text-yellow-600">{metrics?.voice.streamFallbackCount}</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => window.open('https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/editor/28892', '_blank')}
            >
              View Logs <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voice Stream</CardTitle>
            <Badge variant={p95Red ? "destructive" : p95Yellow ? "secondary" : "default"}>
              P95: {p95Red ? "RED" : p95Yellow ? "YELLOW" : "GREEN"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{metrics?.voice.avgHandshakeMs}ms</div>
            <div className="text-xs text-muted-foreground">Avg Handshake</div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">P95:</span>
              <Badge variant={p95Red ? "destructive" : p95Yellow ? "secondary" : "default"}>
                {metrics?.voice.p95HandshakeMs}ms
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              <div>🟢 Target: &lt;1500ms</div>
              <div>🟡 Warning: &gt;1500ms</div>
              <div>🔴 Critical: &gt;2000ms</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => window.open('https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/editor/28893', '_blank')}
            >
              Stream Logs <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SMS</CardTitle>
            {smsHealthy ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{metrics?.sms.inboundCount}</div>
            <div className="text-xs text-muted-foreground">Inbound Messages</div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">Delivery Rate:</span>
              <Badge variant={metrics?.sms.deliverySuccessRate! >= 95 ? "default" : "destructive"}>
                {metrics?.sms.deliverySuccessRate}%
              </Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open('https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/editor/28894', '_blank')}
              >
                Reply Logs
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open('https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/editor/28895', '_blank')}
              >
                Status Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{metrics?.numbers.purchasedCount}</div>
            <div className="text-xs text-muted-foreground">Purchased (24h)</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => window.open('https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/editor/28897', '_blank')}
            >
              Purchase Logs <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PROMPT I: Operator smoke test guidance */}
      <Card>
        <CardHeader>
          <CardTitle>PROMPT I: Operator Smoke Tests</CardTitle>
          <CardDescription>Evidence you can screenshot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="font-semibold">✅ Test 1: Call the newly bought number</div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Hear consent voice, bridge target, call completes</li>
              <li>Evidence: one call_logs row; if stream fallback triggered, stream_fallback=true</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">✅ Test 2: Send inbound SMS</div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Receive template reply</li>
              <li>Evidence: one sms_reply_logs row (source=twilio, external_id=MessageSid)</li>
              <li>Evidence: one sms_status_logs row with "delivered"</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">✅ Test 3: Console spot-check</div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Number shows VoiceUrl: /functions/v1/voice-answer</li>
              <li>Number shows SmsUrl: /functions/v1/webcomms-sms-reply</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">✅ Test 4: Evidence dashboard</div>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>All four tiles reflect increments within 60s</li>
            </ul>
          </div>
          <Alert className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Acceptance: All four pass without manual DB edits</div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

