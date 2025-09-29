import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  interactionDelay: number;
}

export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    loadTime: 0,
    interactionDelay: 0
  });

  // Measure component render time
  const measureRenderTime = useCallback((componentName: string) => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const renderTime = end - start;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100
      }));

      if (renderTime > 16) { // 60fps threshold
        console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
      }
    };
  }, []);

  // Optimize heavy computations with Web Workers
  const optimizeComputation = useCallback(async (data: any, workerScript: string) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerScript);
      
      worker.postMessage(data);
      
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
      
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
    });
  }, []);

  // Memory usage monitoring
  const monitorMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };

      if (memoryUsage.used > memoryUsage.limit * 0.8) {
        console.warn('High memory usage detected:', memoryUsage);
      }

      return memoryUsage;
    }
    return null;
  }, []);

  // Optimize image loading
  const optimizeImageLoading = useCallback(() => {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading="lazy" for better performance
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Optimize image format
      if (img.src && !img.src.includes('data:')) {
        const url = new URL(img.src);
        if (!url.searchParams.has('format')) {
          url.searchParams.set('format', 'webp');
          img.src = url.toString();
        }
      }
    });
  }, []);

  // Bundle size optimization checker
  const checkBundleSize = useCallback(() => {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src && !src.includes('data:')) {
        fetch(src, { method: 'HEAD' })
          .then(response => {
            const size = parseInt(response.headers.get('content-length') || '0');
            totalSize += size;
            
            if (totalSize > 1024 * 1024) { // 1MB threshold
              console.warn('Large bundle size detected:', Math.round(totalSize / 1024), 'KB');
            }
          })
          .catch(() => {}); // Silently ignore CORS errors
      }
    });
  }, []);

  // Network optimization
  const optimizeNetworkRequests = useCallback(() => {
    // Preconnect to important domains
    const importantDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'supabase.co'
    ];

    importantDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      document.head.appendChild(link);
    });

    // Resource hints for performance
  }, []);

  useEffect(() => {
    // Initialize performance optimizations
    optimizeImageLoading();
    optimizeNetworkRequests();
    checkBundleSize();

    // Set up performance monitoring
    const memoryInterval = setInterval(monitorMemoryUsage, 30000); // Every 30 seconds

    return () => {
      clearInterval(memoryInterval);
    };
  }, [optimizeImageLoading, optimizeNetworkRequests, checkBundleSize, monitorMemoryUsage]);

  return {
    metrics,
    measureRenderTime,
    optimizeComputation,
    monitorMemoryUsage,
    optimizeImageLoading,
    optimizeNetworkRequests
  };
};