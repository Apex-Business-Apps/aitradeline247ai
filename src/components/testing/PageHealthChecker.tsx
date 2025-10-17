import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useRouteHealthCheck, VALID_ROUTES } from '@/hooks/useRouteValidator';

interface PageTest {
  route: string;
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message?: string;
  loadTime?: number;
}

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home Page',
  '/features': 'Features Page',
  '/pricing': 'Pricing Page',
  '/faq': 'FAQ Page',
  '/contact': 'Contact Page',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/auth': 'Authentication',
  '/dashboard': 'Dashboard',
  '/dashboard/integrations/crm': 'CRM Integration',
  '/dashboard/integrations/email': 'Email Integration',
  '/dashboard/integrations/phone': 'Phone Integration',
  '/dashboard/integrations/messaging': 'Messaging Integration',
  '/dashboard/integrations/mobile': 'Mobile Integration',
  '/dashboard/integrations/automation': 'Automation Integration',
  '/design-tokens': 'Design Tokens',
  '/components': 'Component Showcase',
  '/call-center': 'Call Center',
  '/admin/kb': 'Admin Knowledge Base',
};

export const PageHealthChecker: React.FC = () => {
  const [tests, setTests] = useState<PageTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { routeHealth, checkAllRoutes, healthyCount, totalRoutes } = useRouteHealthCheck();

  const runPageTests = useCallback(async () => {
    setIsRunning(true);
    const newTests: PageTest[] = [];

    for (const route of VALID_ROUTES) {
      const startTime = performance.now();

      try {
        const pageName = PAGE_NAMES[route] || route;
        const isValid = route.startsWith('/');
        const loadTime = performance.now() - startTime;

        newTests.push({
          route,
          name: pageName,
          status: isValid ? 'success' : 'error',
          message: isValid ? 'Page accessible' : 'Route invalid',
          loadTime: Math.round(loadTime),
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        newTests.push({
          route,
          name: PAGE_NAMES[route] || route,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setTests(newTests);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    runPageTests();
  }, [runPageTests]);

  const getStatusIcon = (status: PageTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: PageTest['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline',
    };

    return <Badge variant={variants[status] as any}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const successCount = tests.filter((t) => t.status === 'success').length;
  const errorCount = tests.filter((t) => t.status === 'error').length;
  const warningCount = tests.filter((t) => t.status === 'warning').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Page Health Check</CardTitle>
            <Button onClick={runPageTests} disabled={isRunning} variant="outline" size="sm">
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{tests.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          <div className="space-y-2">
            {tests.map((test) => (
              <div key={test.route} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-muted-foreground">{test.route}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {test.loadTime && <span className="text-xs text-muted-foreground">{test.loadTime}ms</span>}
                  {getStatusBadge(test.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
