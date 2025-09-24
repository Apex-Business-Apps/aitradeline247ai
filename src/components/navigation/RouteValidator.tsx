import React from 'react';
import { useLocation } from 'react-router-dom';

// Valid routes for the application
const validRoutes = [
  '/',
  '/features',
  '/pricing',
  '/faq',
  '/contact',
  '/privacy',
  '/terms',
  '/auth',
  '/dashboard',
  '/dashboard/integrations/crm',
  '/dashboard/integrations/email',
  '/dashboard/integrations/phone',
  '/dashboard/integrations/messaging',
  '/dashboard/integrations/mobile',
  '/dashboard/integrations/automation',
  '/design-tokens',
  '/components'
];

export const RouteValidator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  // Log route access for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    const isValidRoute = validRoutes.includes(location.pathname);
    if (!isValidRoute) {
      console.warn(`Accessing invalid route: ${location.pathname}`);
    }
  }
  
  return <>{children}</>;
};