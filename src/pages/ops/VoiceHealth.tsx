import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Phone, Key } from 'lucide-react';

interface VoiceHealth {
  secrets: Record<string, boolean>;
  twilioNumbers: any[];
  webhookUrls: {
    staging: Record<string, string>;
    production: Record<string, string>;
  };
  config: {
    pickup_mode: string;
    pickup_rings: number;
    pickup_seconds: number;
    panic_mode: boolean;
    llm_enabled: boolean;
  };
  webhookStats: {
    success_2xx: number;
    error_4xx: number;
    error_5xx: number;
    total: number;
  };
  lastCheck: string;
}

interface SLOData {
  slos: {
    p95_ring_seconds: number;
    handoff_rate: number;
    amd_rate: number;
    consent_decline_rate: number;
    llm_stream_error_rate: number;
    transcript_latency_p95: number;
    realtime_handshake_p50_ms?: number;
    realtime_handshake_p95_ms?: number;
    realtime_fallback_rate?: number;
  };
  thresholds: {
    p95_ring_seconds: number;
    handoff_rate_min: number;
    handoff_rate_max: number;
    llm_stream_error_rate: number;
    transcript_latency_p95: number;
    realtime_handshake_p95_ms?: number;
    realtime_fallback_rate_max?: number;
  };
  metrics: {
    total_calls: number;
    llm_calls: number;
    bridge_calls: number;
    handoffs: number;
    amd_detected: number;
    consent_declined: number;
    llm_errors: number;
    realtime_streams?: number;
    realtime_fallbacks?: number;
  };
  alerts: Array<{
    metric: string;
    value: number;
    threshold: string | number;
    severity: 'warning' | 'critical';
    message: string;
  }>;
  window_hours: number;
  timestamp: string;
}

export default function VoiceHealth() {
  const { toast } = useToast();
  const [health, setHealth] = useState<VoiceHealth | null>(null);
  const [sloData, setSloData] = useState<SLOData | null>(null);
  const [loading, setLoading] = useState(false);
  const supabaseClient = supabase;

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, sloRes] = await Promise.all([
        supabaseClient.functions.invoke('ops-voice-health'),
        supabaseClient.functions.invoke('ops-voice-slo'),
      ]);

      if (healthRes.error) throw healthRes.error;
      if (sloRes.error) throw sloRes.error;

      setHealth(healthRes.data);
      setSloData(sloRes.data);

      toast({
        title: 'Health Check Complete',
        description: 'Voice system health status updated',
      });
    } catch (error: any) {
      console.error('Health check error:', error);
      toast({
        title: 'Health Check Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabaseClient, toast]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const getHealthIcon = (healthy: boolean) => {
    return healthy ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getSeverityColor = (severity: 'warning' | 'critical') => {
    return severity === 'critical' ? 'destructive' : 'secondary';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Voice System Health</h1>
          <p className="text-muted-foreground">V-0 Health Gate & V-9 SLO Monitoring</p>
        </div>
        <Button onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {health && (
        <>
          {/* Test Call Panel */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Place Test Call
              </CardTitle>
              <CardDescription>
                Call the Twilio number to verify voice integration (V-8 Production Test)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Test Number:</p>
                <p className="text-3xl font-bold font-mono">
                  {health.twilioNumbers?.[0]?.e164 || 'Not configured'}
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Test Checklist:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Greeting: "Hi, you've reached TradeLine 24/7 — Your 24/7 AI Receptionist!"</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>LLM responds within 2 seconds</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Press 0 → bridges to +14319900222</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-muted rounded">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Transcript emailed to jrmendozaceo@apexbusiness-systems.com</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secrets Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Environment Secrets
              </CardTitle>
              <CardDescription>Required environment variables (names only)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(health.secrets).map(([name, present]) => (
                  <div key={name} className="flex items-center gap-2">
                    {getHealthIcon(present)}
                    <span className="font-mono text-sm">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Twilio Numbers Card */}
          <Card>
            <CardHeader>
              <CardTitle>Active Twilio Numbers</CardTitle>
              <CardDescription>Configured phone numbers and webhook URLs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {health.twilioNumbers.map((number) => (
                  <div key={number.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{number.e164}</span>
                      <Badge variant={number.active ? 'default' : 'secondary'}>
                        {number.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Voice Answer: {number.voice_answer_url || 'Not set'}</div>
                      <div>Voice Status: {number.voice_status_url || 'Not set'}</div>
                    </div>
                  </div>
                ))}
                {health.twilioNumbers.length === 0 && (
                  <p className="text-muted-foreground">No active numbers configured</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voice Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Configuration</CardTitle>
              <CardDescription>Current pickup and LLM settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Pickup Mode</div>
                  <div className="font-semibold">{health.config.pickup_mode}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pickup Rings</div>
                  <div className="font-semibold">{health.config.pickup_rings} rings</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pickup Seconds</div>
                  <div className="font-semibold">~{health.config.pickup_seconds}s</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">LLM Enabled</div>
                  <div className="flex items-center gap-2">
                    {getHealthIcon(health.config.llm_enabled)}
                    <span className="font-semibold">
                      {health.config.llm_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Panic Mode</div>
                  <div className="flex items-center gap-2">
                    {health.config.panic_mode ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Off</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook Stats (Last 15 Minutes)</CardTitle>
              <CardDescription>Recent webhook request status codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                  <div className="text-2xl font-bold">{health.webhookStats.total}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Success (2xx)</div>
                  <div className="text-2xl font-bold text-green-600">
                    {health.webhookStats.success_2xx}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Client Errors (4xx)</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {health.webhookStats.error_4xx}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Server Errors (5xx)</div>
                  <div className="text-2xl font-bold text-red-600">
                    {health.webhookStats.error_5xx}
                  </div>
                </div>
              </div>
              {(health.webhookStats.error_4xx > 0 || health.webhookStats.error_5xx > 0) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">Warning:</span>
                    <span>Detected webhook errors in the last 15 minutes</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* SLO Monitoring (V-9) */}
      {sloData && (
        <>
          {/* Alerts Card */}
          {sloData.alerts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">SLO Alerts</CardTitle>
                <CardDescription>Threshold breaches detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sloData.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-200"
                    >
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{alert.metric}</span>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SLO Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle>SLO Metrics (24h Window)</CardTitle>
              <CardDescription>Service Level Objectives and thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">P95 Ring Seconds</div>
                  <div className="text-2xl font-bold">{sloData.slos.p95_ring_seconds}s</div>
                  <div className="text-xs text-muted-foreground">
                    Threshold: ≤{sloData.thresholds.p95_ring_seconds}s
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Handoff Rate</div>
                  <div className="text-2xl font-bold">{sloData.slos.handoff_rate}%</div>
                  <div className="text-xs text-muted-foreground">
                    Threshold: {sloData.thresholds.handoff_rate_min}-
                    {sloData.thresholds.handoff_rate_max}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">AMD Rate</div>
                  <div className="text-2xl font-bold">{sloData.slos.amd_rate}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Consent Decline Rate</div>
                  <div className="text-2xl font-bold">{sloData.slos.consent_decline_rate}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">LLM Error Rate</div>
                  <div className="text-2xl font-bold">{sloData.slos.llm_stream_error_rate}%</div>
                  <div className="text-xs text-muted-foreground">
                    Threshold: &lt;{sloData.thresholds.llm_stream_error_rate}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">P95 Transcript Latency</div>
                  <div className="text-2xl font-bold">{sloData.slos.transcript_latency_p95}s</div>
                  <div className="text-xs text-muted-foreground">
                    Threshold: ≤{sloData.thresholds.transcript_latency_p95}s
                  </div>
                </div>
                {sloData.slos.realtime_handshake_p50_ms !== undefined && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Realtime P50 Handshake</div>
                      <div className="text-2xl font-bold">{sloData.slos.realtime_handshake_p50_ms}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Realtime P95 Handshake</div>
                      <div className="text-2xl font-bold">{sloData.slos.realtime_handshake_p95_ms}ms</div>
                      <div className="text-xs text-muted-foreground">
                        Threshold: ≤{sloData.thresholds.realtime_handshake_p95_ms || 1500}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Realtime Fallback Rate</div>
                      <div className="text-2xl font-bold">{sloData.slos.realtime_fallback_rate}%</div>
                      <div className="text-xs text-muted-foreground">
                        Threshold: &lt;{sloData.thresholds.realtime_fallback_rate_max || 5}%
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Call Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Call Metrics (24h Window)</CardTitle>
              <CardDescription>Detailed call statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Calls</div>
                  <div className="text-2xl font-bold">{sloData.metrics.total_calls}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">LLM Calls</div>
                  <div className="text-2xl font-bold">{sloData.metrics.llm_calls}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Bridge Calls</div>
                  <div className="text-2xl font-bold">{sloData.metrics.bridge_calls}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Handoffs</div>
                  <div className="text-2xl font-bold">{sloData.metrics.handoffs}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">AMD Detected</div>
                  <div className="text-2xl font-bold">{sloData.metrics.amd_detected}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Consent Declined</div>
                  <div className="text-2xl font-bold">{sloData.metrics.consent_declined}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">LLM Errors</div>
                  <div className="text-2xl font-bold">{sloData.metrics.llm_errors}</div>
                </div>
                {sloData.metrics.realtime_streams !== undefined && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Realtime Streams</div>
                      <div className="text-2xl font-bold">{sloData.metrics.realtime_streams}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Realtime Fallbacks</div>
                      <div className="text-2xl font-bold">{sloData.metrics.realtime_fallbacks || 0}</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Validation Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Checklist</CardTitle>
          <CardDescription>V-0 through V-11 acceptance criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {health && Object.values(health.secrets).every(v => v) ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>V-0: All environment secrets present</span>
            </div>
            <div className="flex items-center gap-2">
              {health && health.webhookStats.error_4xx === 0 && health.webhookStats.error_5xx === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>V-0: No 4xx/5xx errors in last 15 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              {sloData && sloData.alerts.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <span>V-9: All SLOs within thresholds</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
