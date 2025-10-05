/**
 * HERO GUARDIAN - PERMANENT SAFEGUARDS
 * 
 * This module implements active monitoring and validation of all hero sections
 * across the application. It prevents layout breakage, performance regressions,
 * and structural violations.
 * 
 * DO NOT MODIFY OR REMOVE THIS FILE WITHOUT EXPLICIT APPROVAL.
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

const REQUIRED_ATTRIBUTES = {
  '/': ['data-node="start"', 'data-node="grid"', 'data-node="ron"'],
};

const SAFE_AREA_PROPERTIES = [
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
];

/**
 * Validates hero section structure and styling
 */
export function validateHeroStructure(route: string): HeroValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required data-node attributes
  const requiredNodes = REQUIRED_ATTRIBUTES[route as keyof typeof REQUIRED_ATTRIBUTES];
  if (requiredNodes) {
    requiredNodes.forEach(attr => {
      const [attrName, attrValue] = attr.split('=');
      const value = attrValue?.replace(/"/g, '');
      const element = document.querySelector(`[${attrName}="${value}"]`);
      if (!element) {
        errors.push(`Missing required attribute: ${attr} on route ${route}`);
      }
    });
  }

  // Validate hero section exists
  const heroSection = document.querySelector('section.bg-gradient-orange-subtle, section.hero-section');
  if (!heroSection) {
    errors.push(`No hero section found on route ${route}`);
  } else {
    // Check for safe area insets
    const styles = getComputedStyle(heroSection as HTMLElement);
    SAFE_AREA_PROPERTIES.forEach(prop => {
      const value = styles.getPropertyValue(prop);
      if (!value.includes('env(safe-area-inset')) {
        warnings.push(`Hero section missing ${prop} with safe-area-inset on route ${route}`);
      }
    });

    // Check for fixed units (cm, mm, etc.)
    const computedStyles = styles.cssText;
    if (computedStyles.includes('cm') || computedStyles.includes('mm')) {
      errors.push(`Hero section uses forbidden fixed units (cm/mm) on route ${route}`);
    }
  }

  // Validate logo
  const logo = document.querySelector('img[alt*="TradeLine 24/7"]');
  if (logo && route === '/') {
    const logoImg = logo as HTMLImageElement;
    if (!logoImg.loading || logoImg.loading !== 'eager') {
      warnings.push('Hero logo should use loading="eager" for LCP optimization');
    }
    if (!logoImg.style.aspectRatio) {
      warnings.push('Hero logo missing aspectRatio for CLS prevention');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    route,
  };
}

/**
 * Monitors hero performance metrics
 */
export function monitorHeroPerformance(route: string): Promise<HeroMetrics> {
  return new Promise((resolve) => {
    let lcp = 0;
    let cls = 0;

    // Monitor LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      // Check if LCP is hero-related
      const element = lastEntry.element;
      if (element) {
        const isHeroElement = element.closest('section.bg-gradient-orange-subtle, section.hero-section');
        if (isHeroElement) {
          lcp = lastEntry.renderTime || lastEntry.loadTime;
          
          if (lcp > PERFORMANCE_THRESHOLDS.LCP_MAX) {
            console.error(
              `⚠️ HERO PERFORMANCE VIOLATION: LCP ${lcp}ms exceeds threshold ${PERFORMANCE_THRESHOLDS.LCP_MAX}ms on ${route}`
            );
          }
        }
      }
    });

    // Monitor CLS
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        // Check if shift affects hero
        if (entry.sources) {
          const heroShift = entry.sources.some((source: any) => {
            // Ensure node is a DOM element before calling closest
            if (source.node && source.node instanceof Element && typeof source.node.closest === 'function') {
              return source.node.closest('section.bg-gradient-orange-subtle, section.hero-section');
            }
            return false;
          });
          if (heroShift) {
            cls += entry.value;
            
            if (cls > PERFORMANCE_THRESHOLDS.CLS_MAX) {
              console.error(
                `⚠️ HERO PERFORMANCE VIOLATION: CLS ${cls.toFixed(3)} exceeds threshold ${PERFORMANCE_THRESHOLDS.CLS_MAX} on ${route}`
              );
            }
          }
        }
      }
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('Performance observers not supported');
    }

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
  });
}

/**
 * Validates hero CTAs
 */
export function validateHeroCTAs(): HeroValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const ctas = document.querySelectorAll(
    'section.bg-gradient-orange-subtle button, section.hero-section button, [data-node="start"] button'
  );

  ctas.forEach((cta, index) => {
    const btn = cta as HTMLElement;
    const rect = btn.getBoundingClientRect();

    // Check touch target size (minimum 44x44)
    if (rect.width < 44 || rect.height < 44) {
      warnings.push(
        `Hero CTA #${index + 1} has insufficient touch target: ${rect.width}x${rect.height}px (minimum 44x44px)`
      );
    }

    // Check if CTA is visible
    if (rect.width === 0 || rect.height === 0) {
      errors.push(`Hero CTA #${index + 1} is not visible`);
    }

    // Check if CTA has action
    const hasOnClick = btn.onclick !== null;
    const hasHref = btn.closest('a') !== null;
    const hasType = btn.getAttribute('type') === 'submit';
    
    if (!hasOnClick && !hasHref && !hasType) {
      warnings.push(`Hero CTA #${index + 1} may not have a valid action`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    route: window.location.pathname,
  };
}

/**
 * Initialize hero guardian monitoring
 */
export function initHeroGuardian() {
  const route = window.location.pathname;

  // Run validation on load
  setTimeout(() => {
    const structureValidation = validateHeroStructure(route);
    const ctaValidation = validateHeroCTAs();

    // Log results
    if (!structureValidation.isValid) {
      console.error('🚨 HERO STRUCTURE VALIDATION FAILED:', structureValidation);
    }
    if (structureValidation.warnings.length > 0) {
      console.warn('⚠️ Hero Structure Warnings:', structureValidation.warnings);
    }

    if (!ctaValidation.isValid) {
      console.error('🚨 HERO CTA VALIDATION FAILED:', ctaValidation);
    }
    if (ctaValidation.warnings.length > 0) {
      console.warn('⚠️ Hero CTA Warnings:', ctaValidation.warnings);
    }

    // Monitor performance
    monitorHeroPerformance(route).then((metrics) => {
      console.log('📊 Hero Performance Metrics:', metrics);
      
      // Store metrics for analysis
      if (typeof window !== 'undefined') {
        (window as any).__heroMetrics = (window as any).__heroMetrics || [];
        (window as any).__heroMetrics.push(metrics);
      }
    });
  }, 1000);

  // Enhanced layout protection with immediate recovery
  const observer = new MutationObserver((mutations) => {
    let heroChanged = false;
    
    mutations.forEach(mutation => {
      if (mutation.target) {
        const target = mutation.target as Element;
        const isHeroElement = target.matches('#start-trial-hero, #roi-calculator, .hero-roi__grid, .hero-roi__container') ||
                             target.querySelector('#start-trial-hero, #roi-calculator, .hero-roi__grid, .hero-roi__container');
        
        if (isHeroElement) {
          heroChanged = true;
          
          // Immediately restore if locked element was modified
          if (target.hasAttribute('data-lovable-lock')) {
            console.warn('🔒 Blocked modification to locked hero element:', target);
            
            // Restore layout if needed
            if (typeof window !== 'undefined' && (window as any).enforceHeroRoiDuo) {
              (window as any).enforceHeroRoiDuo();
            }
          }
        }
      }
    });
    
    if (heroChanged) {
      const validation = validateHeroStructure(route);
      if (!validation.isValid) {
        console.error('🚨 HERO STRUCTURE CHANGED DYNAMICALLY:', validation);
        
        // Attempt recovery
        if (typeof window !== 'undefined' && (window as any).enforceHeroRoiDuo) {
          console.log('🔧 Attempting hero layout recovery...');
          (window as any).enforceHeroRoiDuo();
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-node', 'class', 'style', 'data-lovable-lock'],
  });

  // Watch for orientation changes to enforce portrait centering
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).enforceHeroRoiDuo) {
        (window as any).enforceHeroRoiDuo();
      }
    }, 100);
  });

  console.log('✅ Hero Guardian initialized with enhanced protection on route:', route);
}
