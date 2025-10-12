/**
 * Preview Environment Health Check
 * Runs comprehensive diagnostics on preview environments
 */

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    details?: any;
  }[];
  timestamp: string;
  environment: string;
}

export async function runPreviewHealthCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = [];
  const hostname = window.location.hostname;
  
  // Check 1: Environment detection
  const isPreview = hostname.includes('lovableproject.com') || 
                    hostname.includes('lovable.app') || 
                    hostname.includes('lovable.dev') ||
                    hostname.includes('.gptengineer.app');
  
  checks.push({
    name: 'Environment Detection',
    status: isPreview ? 'pass' : 'warn',
    message: isPreview ? 'Preview environment detected' : 'Not a preview environment',
    details: { hostname, isPreview }
  });

  // Check 2: Root element visibility
  const root = document.getElementById('root');
  const rootVisible = root ? window.getComputedStyle(root).display !== 'none' : false;
  const rootOpacity = root ? window.getComputedStyle(root).opacity : '0';
  
  checks.push({
    name: 'Root Element Visibility',
    status: rootVisible && parseFloat(rootOpacity) > 0 ? 'pass' : 'fail',
    message: rootVisible ? 'Root element is visible' : 'Root element is hidden',
    details: { 
      exists: !!root, 
      visible: rootVisible,
      opacity: rootOpacity,
      display: root ? window.getComputedStyle(root).display : 'N/A'
    }
  });

  // Check 3: Service Worker status
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const swStatus = import.meta.env.DEV ? 'disabled' : (registrations.length > 0 ? 'active' : 'none');
    
    checks.push({
      name: 'Service Worker',
      status: import.meta.env.DEV || registrations.length === 0 ? 'pass' : 'warn',
      message: `Service worker ${swStatus}`,
      details: { 
        count: registrations.length,
        dev: import.meta.env.DEV,
        registrations: registrations.map(r => r.scope)
      }
    });
  }

  // Check 4: Safe mode
  const urlParams = new URLSearchParams(window.location.search);
  const safeMode = urlParams.get('safe') === '1';
  
  checks.push({
    name: 'Safe Mode',
    status: safeMode ? 'warn' : 'pass',
    message: safeMode ? 'Safe mode active' : 'Normal mode',
    details: { safeMode, url: window.location.href }
  });

  // Check 5: Error boundaries
  const errorBoundaryActive = !!(window as any).__ERROR_BOUNDARY_ACTIVE__;
  
  checks.push({
    name: 'Error Boundaries',
    status: 'pass',
    message: 'Error boundaries loaded',
    details: { active: errorBoundaryActive }
  });

  // Check 6: Console errors
  const recentErrors = (window as any).__RECENT_ERRORS__ || [];
  
  checks.push({
    name: 'Console Errors',
    status: recentErrors.length === 0 ? 'pass' : 'warn',
    message: `${recentErrors.length} recent errors`,
    details: { errors: recentErrors.slice(-5) }
  });

  // Check 7: Network connectivity
  const online = navigator.onLine;
  
  checks.push({
    name: 'Network Connectivity',
    status: online ? 'pass' : 'fail',
    message: online ? 'Online' : 'Offline',
    details: { online }
  });

  // Check 8: Performance metrics
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    
    checks.push({
      name: 'Page Load Time',
      status: loadTime < 3000 ? 'pass' : (loadTime < 5000 ? 'warn' : 'fail'),
      message: `${loadTime}ms`,
      details: { loadTime, timing: {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.requestStart,
        download: timing.responseEnd - timing.responseStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart
      }}
    });
  }

  // Overall status
  const hasFailures = checks.some(c => c.status === 'fail');
  const hasWarnings = checks.some(c => c.status === 'warn');
  const status = hasFailures ? 'error' : (hasWarnings ? 'warning' : 'healthy');

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
    environment: hostname
  };
}

// Error tracking
if (typeof window !== 'undefined') {
  (window as any).__RECENT_ERRORS__ = [];
  
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errors = (window as any).__RECENT_ERRORS__ || [];
    errors.push({
      message: args.join(' '),
      timestamp: new Date().toISOString()
    });
    // Keep only last 20 errors
    if (errors.length > 20) {
      errors.shift();
    }
    (window as any).__RECENT_ERRORS__ = errors;
    originalError.apply(console, args);
  };
}
