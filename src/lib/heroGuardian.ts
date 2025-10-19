/**
 * HERO GUARDIAN - NON-BLOCKING MONITORING
 * 
 * Monitors hero section performance and structure without interfering with app operation.
 * All validations are informational only - no errors that could block the app.
 */

export interface HeroMetrics {
  lcp: number;
  cls: number;
  route: string;
  timestamp: number;
}

export interface HeroValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  route: string;
}

const PERFORMANCE_THRESHOLDS = {
  LCP_MAX: 2500, // 2.5s
  CLS_MAX: 0.05,
};

/**
 * Validates hero section structure (non-blocking)
 */
export function validateHeroStructure(route: string): HeroValidation {
  const warnings: string[] = [];
  
  // Only validate on homepage
  if (route !== '/') {
    return { isValid: true, errors: [], warnings: [], route };
  }
  
  // Check for actual data-node attributes that exist in the code
  const grid = document.querySelector('[data-node="grid"]');
  const roi = document.querySelector('[data-node="ron"]');
  const start = document.querySelector('[data-node="start"]');
  
  if (!grid) warnings.push('Hero grid not yet rendered');
  if (!roi) warnings.push('ROI calculator not yet rendered');
  if (!start) warnings.push('Start trial not yet rendered');
  
  // Validate hero section exists
  const heroSection = document.querySelector('section.bg-gradient-orange-subtle, section.hero-section');
  if (!heroSection && route === '/') {
    warnings.push('Hero section not yet rendered');
  }

  return {
    isValid: true, // Always valid - we just log warnings
    errors: [],
    warnings,
    route,
  };
}

/**
 * Monitors hero performance metrics (non-blocking)
 */
export function monitorHeroPerformance(route: string): Promise<HeroMetrics> {
  return new Promise((resolve) => {
    let lcp = 0;
    let cls = 0;

    // Monitor LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry) {
          lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        }
      });

      // Monitor CLS  
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (entry.value) {
            cls += entry.value;
          }
        }
      });

      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Resolve after a reasonable time
      setTimeout(() => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        
        resolve({
          lcp,
          cls,
          route,
          timestamp: Date.now(),
        });
      }, 5000);
    } catch (e) {
      // Silently handle errors
      resolve({ lcp: 0, cls: 0, route, timestamp: Date.now() });
    }
  });
}

/**
 * Initialize hero guardian monitoring (non-blocking)
 */
export function initHeroGuardian() {
  const route = window.location.pathname;

  // Delay validation to ensure React has mounted
  setTimeout(() => {
    const validation = validateHeroStructure(route);
    
    if (validation.warnings.length > 0) {
      console.log('[HeroGuardian] ℹ️ Hero validation info:', validation.warnings);
    } else {
      console.log('[HeroGuardian] ✅ Hero structure validated successfully');
    }

    // Monitor performance (informational only)
    monitorHeroPerformance(route).then((metrics) => {
      if (metrics.lcp > PERFORMANCE_THRESHOLDS.LCP_MAX) {
        console.log('[HeroGuardian] ℹ️ LCP could be improved:', metrics.lcp, 'ms');
      }
      if (metrics.cls > PERFORMANCE_THRESHOLDS.CLS_MAX) {
        console.log('[HeroGuardian] ℹ️ CLS could be improved:', metrics.cls);
      }
      
      // Store metrics for analysis
      if (typeof window !== 'undefined') {
        (window as any).__heroMetrics = (window as any).__heroMetrics || [];
        (window as any).__heroMetrics.push(metrics);
      }
    });
  }, 2000); // 2 second delay to allow full React mount

  console.log('[HeroGuardian] ✅ Monitoring initialized (non-blocking mode)');
}

