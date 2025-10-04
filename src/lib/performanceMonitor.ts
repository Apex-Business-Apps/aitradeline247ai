// Production-ready performance monitoring
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100;
  private reportingEndpoint: string | null = null;

  constructor() {
    this.setupObservers();
  }

  private setupObservers() {
    if (typeof window === 'undefined') return;

    // Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime, {
            element: lastEntry.element?.tagName
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime, {
              eventType: entry.name
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.recordMetric('CLS', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Long tasks (performance bottlenecks)
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('LongTask', entry.duration, {
              startTime: entry.startTime
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Long task observer not supported');
      }
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.recordMetric('TTFB', navigation.responseStart - navigation.requestStart);
          this.recordMetric('DOMContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.recordMetric('LoadComplete', navigation.loadEventEnd - navigation.loadEventStart);
        }
      }, 0);
    });
  }

  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value),
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Limit metrics array size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log significant issues
    if (name === 'LCP' && value > 2500) {
      console.warn(`⚠️ Poor LCP: ${Math.round(value)}ms`);
    }
    if (name === 'FID' && value > 100) {
      console.warn(`⚠️ Poor FID: ${Math.round(value)}ms`);
    }
    if (name === 'CLS' && value > 0.1) {
      console.warn(`⚠️ Poor CLS: ${value.toFixed(3)}`);
    }
    if (name === 'LongTask' && value > 50) {
      console.warn(`⚠️ Long task detected: ${Math.round(value)}ms`);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsSummary() {
    const summary: Record<string, { avg: number; max: number; count: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { avg: 0, max: 0, count: 0 };
      }
      summary[metric.name].avg += metric.value;
      summary[metric.name].max = Math.max(summary[metric.name].max, metric.value);
      summary[metric.name].count++;
    });

    Object.keys(summary).forEach(key => {
      summary[key].avg = Math.round(summary[key].avg / summary[key].count);
    });

    return summary;
  }

  clearMetrics() {
    this.metrics = [];
  }

  // For debugging in console
  printSummary() {
    console.table(this.getMetricsSummary());
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
}
