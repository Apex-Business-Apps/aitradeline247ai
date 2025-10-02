import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { Shield, AlertTriangle, Activity, Lock, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function SecurityMonitoring() {
  const { data, isLoading, error } = useSecurityMonitoring();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to view this page. Security monitoring is only available to administrators.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Monitoring Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time security metrics and threat detection
            {data && (
              <span className="ml-2 text-xs">
                Last updated: {formatDistanceToNow(new Date(data.generated_at), { addSuffix: true })}
              </span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted" />
                <CardContent className="h-32 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : data ? (
          <>
            {/* Security Alerts Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.security_alerts.total_alerts}</div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {data.security_alerts.critical_alerts}
                  </div>
                  <p className="text-xs text-muted-foreground">Require immediate attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.security_alerts.unresolved_alerts}</div>
                  <p className="text-xs text-muted-foreground">Pending review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Auth</CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.failed_auth.total_failures}</div>
                  <p className="text-xs text-muted-foreground">
                    From {data.failed_auth.unique_ips} IPs
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Rate Limiting Status */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Rate Limiting & Protection
                </CardTitle>
                <CardDescription>Active blocks and rate limit enforcement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Hotline ANI Blocks</p>
                    <p className="text-2xl font-bold">{data.rate_limits.hotline_ani_blocks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hotline IP Blocks</p>
                    <p className="text-2xl font-bold">{data.rate_limits.hotline_ip_blocks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Support Ticket Limits</p>
                    <p className="text-2xl font-bold">{data.rate_limits.support_ticket_limits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Blocks</p>
                    <p className="text-2xl font-bold text-destructive">
                      {data.rate_limits.active_blocks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PII Access Monitoring */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  PII Access Audit
                </CardTitle>
                <CardDescription>
                  Tracking access to personally identifiable information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Accesses</p>
                      <p className="text-2xl font-bold">{data.pii_access.total_accesses}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Users</p>
                      <p className="text-2xl font-bold">{data.pii_access.unique_users}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">By Access Type</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {data.pii_access.by_access_type &&
                          Object.entries(data.pii_access.by_access_type).map(([type, count]) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}: {count}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>

                  {data.pii_access.recent_accesses && data.pii_access.recent_accesses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Recent PII Accesses</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {data.pii_access.recent_accesses.slice(0, 10).map((access: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm border-b pb-2"
                          >
                            <div>
                              <Badge variant="outline" className="mr-2">
                                {access.access_type}
                              </Badge>
                              <span className="text-muted-foreground">{access.table}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(access.timestamp), { addSuffix: true })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Security Alerts */}
            {data.security_alerts.recent_alerts && data.security_alerts.recent_alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recent Security Alerts
                  </CardTitle>
                  <CardDescription>Latest security events and anomalies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.security_alerts.recent_alerts.slice(0, 15).map((alert: any, i: number) => (
                      <Alert
                        key={i}
                        variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default'}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <AlertTitle className="flex items-center gap-2">
                              <Badge
                                variant={alert.resolved ? 'secondary' : 'default'}
                                className="text-xs"
                              >
                                {alert.severity}
                              </Badge>
                              {alert.type}
                            </AlertTitle>
                            <AlertDescription className="mt-2 text-xs">
                              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                              {alert.resolved && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Resolved
                                </Badge>
                              )}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
