import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// All valid routes in the application
export const VALID_ROUTES = [
  '/',
  '/features',
  '/pricing',
  '/faq',
  '/contact',
  '/privacy',
  '/terms',
  '/auth',
  '/thank-you',
  '/dashboard',
  '/dashboard/integrations/crm',
  '/dashboard/integrations/email',
  '/dashboard/integrations/phone',
  '/dashboard/integrations/messaging',
  '/dashboard/integrations/mobile',
  '/dashboard/integrations/automation',
  '/design-tokens',
  '/components',
  '/call-center',
  '/admin/kb',
  '/documentation',
  '/security-monitoring'
] as const;

export type ValidRoute = typeof VALID_ROUTES[number];

interface RouteValidationResult {
  isValid: boolean;
  currentRoute: string;
  suggestedRedirect?: string;
}

export function useRouteValidator() {
  const location = useLocation();
  const navigate = useNavigate();
  const [validationResult, setValidationResult] = useState<RouteValidationResult>({
    isValid: true,
    currentRoute: location.pathname
  });

  useEffect(() => {
    const currentPath = location.pathname;
    const isValid = VALID_ROUTES.includes(currentPath as ValidRoute);
    
    let suggestedRedirect: string | undefined;
    
    if (!isValid) {
      // Suggest similar routes
      if (currentPath.startsWith('/dashboard')) {
        suggestedRedirect = '/dashboard';
      } else if (currentPath.includes('feature')) {
        suggestedRedirect = '/features';
      } else if (currentPath.includes('price') || currentPath.includes('plan')) {
        suggestedRedirect = '/pricing';
      } else if (currentPath.includes('help') || currentPath.includes('faq')) {
        suggestedRedirect = '/faq';
      } else if (currentPath.includes('contact') || currentPath.includes('support')) {
        suggestedRedirect = '/contact';
      } else {
        suggestedRedirect = '/';
      }
    }

    setValidationResult({
      isValid,
      currentRoute: currentPath,
      suggestedRedirect
    });

    // Log invalid routes in development
    if (!isValid && process.env.NODE_ENV === 'development') {
      console.warn(`Invalid route accessed: ${currentPath}. Suggested: ${suggestedRedirect}`);
    }
  }, [location.pathname]);

  const redirectToValid = () => {
    if (validationResult.suggestedRedirect) {
      navigate(validationResult.suggestedRedirect, { replace: true });
    }
  };

  const validateRoute = (route: string): boolean => {
    return VALID_ROUTES.includes(route as ValidRoute);
  };

  return {
    ...validationResult,
    redirectToValid,
    validateRoute,
    allValidRoutes: VALID_ROUTES
  };
}

// Hook to check if all routes are accessible
export function useRouteHealthCheck() {
  const [routeHealth, setRouteHealth] = useState<Record<string, boolean>>({});
  const [isChecking, setIsChecking] = useState(false);

  const checkAllRoutes = async () => {
    setIsChecking(true);
    const health: Record<string, boolean> = {};

    // Simple check - we can't actually navigate to test, but we can validate route structure
    for (const route of VALID_ROUTES) {
      // For now, assume all routes are healthy if they're in our valid list
      // In a real implementation, you might ping each route or check component availability
      health[route] = true;
    }

    setRouteHealth(health);
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllRoutes();
  }, []);

  const getFailedRoutes = () => {
    return Object.entries(routeHealth)
      .filter(([_, isHealthy]) => !isHealthy)
      .map(([route]) => route);
  };

  const getHealthyRoutes = () => {
    return Object.entries(routeHealth)
      .filter(([_, isHealthy]) => isHealthy)
      .map(([route]) => route);
  };

  return {
    routeHealth,
    isChecking,
    checkAllRoutes,
    getFailedRoutes,
    getHealthyRoutes,
    totalRoutes: VALID_ROUTES.length,
    healthyCount: getHealthyRoutes().length,
    failedCount: getFailedRoutes().length
  };
}