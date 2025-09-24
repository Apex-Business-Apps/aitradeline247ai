import { useEffect } from 'react';
import { useAnalytics } from './useAnalytics';

interface ErrorInfo {
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: number;
  userAgent: string;
  url: string;
}

export const useErrorTracking = () => {
  const { track } = useAnalytics();

  const trackError = (error: Error, context?: Record<string, any>) => {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };

    track({
      event_type: 'javascript_error',
      event_data: errorInfo
    });
  };

  const trackPerformanceIssue = (metric: string, value: number, threshold: number) => {
    if (value > threshold) {
      track({
        event_type: 'performance_issue',
        event_data: {
          metric,
          value,
          threshold,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    }
  };

  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    };

    // Promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      trackError(error, {
        type: 'unhandled_promise_rejection'
      });
    };

    // Web Vitals monitoring
    const observeWebVitals = () => {
      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            trackPerformanceIssue('lcp', lastEntry.startTime, 2500);
          }
        });
        
        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let cumulativeScore = 0;
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              cumulativeScore += entry.value;
            }
          }
          if (cumulativeScore > 0) {
            trackPerformanceIssue('cls', cumulativeScore, 0.1);
          }
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // CLS not supported
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Start observing performance metrics
    if (document.readyState === 'complete') {
      observeWebVitals();
    } else {
      window.addEventListener('load', observeWebVitals);
    }

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('load', observeWebVitals);
    };
  }, [track]);

  return {
    trackError,
    trackPerformanceIssue
  };
};