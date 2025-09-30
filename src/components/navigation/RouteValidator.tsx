import React from 'react';
import { useLocation } from 'react-router-dom';
import { useRouteValidator } from '@/hooks/useRouteValidator';

export const RouteValidator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isValid, suggestedRedirect } = useRouteValidator();
  
  // Log route access for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    if (!isValid) {
      console.warn(`Accessing invalid route: ${location.pathname}. Suggested: ${suggestedRedirect}`);
    } else {
      console.log(`Valid route accessed: ${location.pathname}`);
    }
  }
  
  return <>{children}</>;
};