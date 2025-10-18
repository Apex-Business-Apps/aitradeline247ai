import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Server-verified admin route protection
 * Renders nothing if user is not admin (prevents UI intel leak)
 */
export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        // Server-side admin verification via edge function
        const { data, error } = await supabase.functions.invoke('admin-check', {
          method: 'GET'
        });
        
        if (mounted) {
          setOk(!error && data?.ok === true);
        }
      } catch {
        if (mounted) setOk(false);
      }
    })();
    
    return () => { 
      mounted = false; 
    };
  }, []);

  // Loading state - show nothing to avoid flash
  if (ok === null) return null;
  
  // Not authorized - render nothing (security by obscurity for UI)
  if (!ok) return <></>;
  
  // Authorized - render admin content
  return <>{children}</>;
}
