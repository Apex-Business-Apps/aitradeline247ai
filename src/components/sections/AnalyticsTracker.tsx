import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSecureAnalytics } from '@/hooks/useSecureAnalytics';

export const AnalyticsTracker = () => {
  const location = useLocation();
  const { trackPageView } = useSecureAnalytics();

  useEffect(() => {
    // Extract page name from pathname
    const pageName = location.pathname === '/' ? 'home' : location.pathname.slice(1);
    
    // Track page view
    trackPageView(pageName);
  }, [location, trackPageView]);

  return null; // This component doesn't render anything
};
