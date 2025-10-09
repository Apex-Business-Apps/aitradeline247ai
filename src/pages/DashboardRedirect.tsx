import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Public alias: /dashboard → 301 to /app/dashboard
 * Pure convenience; avoids broken links from marketing or memory.
 */
export default function DashboardRedirect() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/app/dashboard', { replace: true });
  }, [navigate]);
  
  return null;
}
