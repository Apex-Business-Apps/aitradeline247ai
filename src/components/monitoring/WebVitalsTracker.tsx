import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export const WebVitalsTracker = () => {
  const { track } = useAnalytics();

  useEffect(() => {
    const trackWebVital = (name: string, value: number, id?: string) => {
      // CRITICAL FIX: Validate metric values before tracking
      const roundedValue = Math.round(value);
      
      // Validate based on metric type
      let isValid = false;
      if (name === 'LCP' || name === 'FCP' || name === 'TTFB') {
        isValid = roundedValue > 0 && roundedValue < 60000; // < 60s
      } else if (name === 'FID' || name === 'INP') {
        isValid = roundedValue >= 0 && roundedValue < 10000; // < 10s
      } else if (name === 'CLS') {
        isValid = value >= 0 && value < 10; // CLS is unitless score
      } else {
        // For other metrics like LoadTime, DOMReady
        isValid = roundedValue > 0 && roundedValue < 120000; // < 2 minutes
      }
      
      if (!isValid) {
        console.warn(`Invalid ${name} metric: ${roundedValue} - skipping`);
        return;
      }
      
      track({
        event_type: 'web_vital',
        event_data: {
          name,
          value: roundedValue,
          id,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    };

    // Function to get Web Vitals
    const getWebVitals = () => {
      // LCP - Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            if (lastEntry) {
              trackWebVital('LCP', lastEntry.startTime, lastEntry.id);
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // CLS - Cumulative Layout Shift
          let cumulativeScore = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                cumulativeScore += entry.value;
              }
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Report CLS on page unload
          const reportCLS = () => {
            trackWebVital('CLS', cumulativeScore);
          };
          
          window.addEventListener('beforeunload', reportCLS);
          window.addEventListener('pagehide', reportCLS);

          // FID - First Input Delay (now using INP as alternative)
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (entry.processingStart && entry.startTime) {
                const fid = entry.processingStart - entry.startTime;
                trackWebVital('FID', fid, entry.entryType);
              }
            }
          });
          
          try {
            fidObserver.observe({ entryTypes: ['first-input'] });
          } catch (e) {
            // FID not supported, try INP
            try {
              const inpObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as any[]) {
                  trackWebVital('INP', entry.duration, entry.name);
                }
              });
              inpObserver.observe({ entryTypes: ['interaction'] });
            } catch (e) {
              // Neither supported
            }
          }

          // TTFB - Time to First Byte
          const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
          if (navigationEntry) {
            const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
            trackWebVital('TTFB', ttfb);
          }

          // FCP - First Contentful Paint
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const firstEntry = entries[0] as any;
            if (firstEntry) {
              trackWebVital('FCP', firstEntry.startTime);
            }
          });
          
          try {
            fcpObserver.observe({ entryTypes: ['paint'] });
          } catch (e) {
            // Paint timing not supported
          }

        } catch (error) {
          console.warn('Web Vitals tracking not supported:', error);
        }
      }

      // Performance metrics from navigation timing
      if ('performance' in window && 'timing' in performance) {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        const connectTime = timing.connectEnd - timing.connectStart;

        if (loadTime > 0) trackWebVital('LoadTime', loadTime);
        if (domReady > 0) trackWebVital('DOMReady', domReady);
        if (connectTime > 0) trackWebVital('ConnectTime', connectTime);
      }
    };

    // Start monitoring after page load
    if (document.readyState === 'complete') {
      getWebVitals();
    } else {
      window.addEventListener('load', getWebVitals);
    }

    return () => {
      window.removeEventListener('load', getWebVitals);
    };
  }, [track]);

  return null; // This component doesn't render anything
};