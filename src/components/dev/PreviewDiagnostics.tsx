/**
 * Preview Diagnostics Panel
 * Shows health check results in development/preview
 */

import { useState, useEffect } from 'react';
import { runPreviewHealthCheck, type HealthCheckResult } from '@/lib/previewHealthCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, AlertCircle, XCircle, ChevronDown, RefreshCw } from 'lucide-react';

export function PreviewDiagnostics() {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Auto-run on mount in preview/dev
    const hostname = window.location.hostname;
    const isPreview = hostname.includes('lovableproject.com') || 
                      hostname.includes('https://tradeline247aicom.lovable.app/') || 
                      hostname.includes('lovable.dev') ||
                      import.meta.env.DEV;
    
    if (isPreview) {
      runCheck();
    }
  }, []);

  const runCheck = async () => {
    setLoading(true);
    try {
      const result = await runPreviewHealthCheck();
      setHealthCheck(result);
      
      // Auto-show if there are issues
      if (result.status !== 'healthy') {
        setVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't show in production
  if (!import.meta.env.DEV && !window.location.hostname.includes('lovable')) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-600">Healthy</Badge>;
      case 'warning': return <Badge className="bg-yellow-600">Warning</Badge>;
      case 'error': return <Badge className="bg-red-600">Error</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  if (!visible) {
    return (
      <Button
        onClick={() => setVisible(true)}
        className="fixed bottom-4 right-4 z-[9999] shadow-lg"
        size="sm"
        variant="outline"
      >
        🔍 Diagnostics
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 max-h-[80vh] overflow-auto">
      <Card className="shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Preview Diagnostics</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={runCheck} 
                disabled={loading}
                size="sm"
                variant="ghost"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                onClick={() => setVisible(false)}
                size="sm"
                variant="ghost"
              >
                ✕
              </Button>
            </div>
          </div>
          <CardDescription>
            {healthCheck && (
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(healthCheck.status)}
                <span className="text-xs text-muted-foreground">
                  {new Date(healthCheck.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {healthCheck?.checks.map((check, idx) => (
            <Collapsible key={idx}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-muted">
                <div className="flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  <span className="text-sm font-medium">{check.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{check.message}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              {check.details && (
                <CollapsibleContent className="pt-2 pl-8">
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(check.details, null, 2)}
                  </pre>
                </CollapsibleContent>
              )}
            </Collapsible>
          ))}

          <div className="pt-4 text-xs text-center text-muted-foreground">
            Press Ctrl+Shift+D to toggle
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Keyboard shortcut
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      const event = new CustomEvent('toggle-diagnostics');
      window.dispatchEvent(event);
    }
  });
}

