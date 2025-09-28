import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchJson } from '@/lib/fetchJson';

interface StatusData {
  ok: boolean;
  ts: string;
  region?: string;
  deps?: {
    supabase?: boolean;
  };
  version?: {
    gitSha?: string;
    builtAt?: string;
  };
}

interface VersionData {
  gitSha?: string;
  builtAt?: string;
}

export default function Status() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [versionData, setVersionData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatusData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [status, version] = await Promise.all([
        fetchJson('/status.json'),
        fetch('/version', { cache: 'no-store' }).then(r => r.text())
      ]);
      
      setStatusData(status);
      setVersionData(version);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusData();
  }, []);

  const getStatusBadge = (isOk: boolean) => (
    <Badge variant={isOk ? "default" : "destructive"}>
      {isOk ? "Operational" : "Issues Detected"}
    </Badge>
  );

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">System Status</h1>
            <p className="text-muted-foreground">
              Current operational status of TradeLine 24/7 services
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  System Status
                  <Button onClick={fetchStatusData} variant="outline" size="sm" disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error ? (
                  <div className="text-destructive">{error}</div>
                ) : statusData ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Overall Status</span>
                      {getStatusBadge(statusData.ok)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Last Check</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(statusData.ts)}
                      </span>
                    </div>

                    {statusData.region && (
                      <div className="flex items-center justify-between">
                        <span>Region</span>
                        <span className="text-sm">{statusData.region}</span>
                      </div>
                    )}

                    {statusData.deps && (
                      <div>
                        <h4 className="font-medium mb-2">Dependencies</h4>
                        <div className="space-y-2">
                          {Object.entries(statusData.deps).map(([service, isOk]) => (
                            <div key={service} className="flex items-center justify-between">
                              <span className="capitalize">{service}</span>
                              {getStatusBadge(Boolean(isOk))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>Loading status...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Version Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {versionData ? (
                  <>
                    {statusData?.version?.gitSha && (
                      <div className="flex items-center justify-between">
                        <span>Git SHA</span>
                        <span className="text-sm font-mono">
                          {statusData.version.gitSha.substring(0, 8)}
                        </span>
                      </div>
                    )}
                    
                    {statusData?.version?.builtAt && (
                      <div className="flex items-center justify-between">
                        <span>Built At</span>
                        <span className="text-sm">
                          {formatTimestamp(statusData.version.builtAt)}
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-2 text-xs text-muted-foreground font-mono">
                      {versionData}
                    </div>
                  </>
                ) : (
                  <div>Loading version...</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center space-x-4">
            <a href="/privacy" className="text-muted-foreground hover:text-primary text-sm">
              Privacy Policy
            </a>
            <a href="/terms" className="text-muted-foreground hover:text-primary text-sm">
              Terms of Service
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}