import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Global kill-switch for any Twilio Console links
 * Intercepts clicks on any anchor targeting twilio.com
 */
export function TwilioLinkGuard() {
  const { toast } = useToast();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor?.href && anchor.href.includes('twilio.com')) {
        e.preventDefault();
        e.stopPropagation();
        
        toast({
          title: "Numbers are provisioned in-app",
          description: "Please use the Add Number button in your dashboard to provision numbers through our secure API.",
          variant: "default",
        });
      }
    };

    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [toast]);

  return null;
}

