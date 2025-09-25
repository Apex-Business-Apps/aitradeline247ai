import { useCallback, useRef } from 'react';

interface TransitionOptions {
  duration?: number;
  easing?: string;
  transform?: string;
}

export const useOptimizedTransitions = () => {
  const transitionRef = useRef<Map<string, boolean>>(new Map());

  // Optimized page transition with smooth animations
  const smoothTransition = useCallback((elementId: string, options: TransitionOptions = {}) => {
    const {
      duration = 300,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      transform = 'translateY(0)'
    } = options;

    if (transitionRef.current.get(elementId)) return; // Prevent multiple transitions

    const element = document.getElementById(elementId);
    if (!element) return;

    transitionRef.current.set(elementId, true);

    element.style.transition = `all ${duration}ms ${easing}`;
    element.style.transform = transform;
    element.style.opacity = '1';

    setTimeout(() => {
      transitionRef.current.set(elementId, false);
    }, duration);
  }, []);

  // Optimize scroll behavior
  const smoothScroll = useCallback((targetId: string, offset: number = 0) => {
    const element = document.getElementById(targetId);
    if (!element) return;

    const targetPosition = element.offsetTop - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }, []);

  // Debounced function for performance optimization
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Throttled function for scroll events
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  // Lazy load images for better performance
  const setupLazyLoading = useCallback(() => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }, []);

  // Optimize component mounting
  const optimizedMount = useCallback((callback: Function, dependencies: any[] = []) => {
    const mountRef = useRef(false);
    
    if (!mountRef.current) {
      mountRef.current = true;
      requestAnimationFrame(() => callback());
    }
  }, []);

  return {
    smoothTransition,
    smoothScroll,
    debounce,
    throttle,
    setupLazyLoading,
    optimizedMount
  };
};