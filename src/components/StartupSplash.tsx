import React, { useEffect, useState } from "react";

export default function StartupSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // feature flag + one-time per session
    const disabled = import.meta.env.VITE_SPLASH_ENABLED === "false";
    const urlOff = new URLSearchParams(location.search).has("nosplash");
    const seen = sessionStorage.getItem("tl_splash_dismissed") === "1";
    if (disabled || urlOff || seen) return;
    
    // Safety: Ensure app is actually mounted before showing splash
    const checkMount = () => {
      const root = document.getElementById('root');
      const main = document.getElementById('main');
      if (root && (root.children.length > 0 || main)) {
        setShow(true);
        const t = setTimeout(() => dismiss(), 1000); // Reduced from 1800ms
        return () => clearTimeout(t);
      } else {
        // App not mounted yet, dismiss splash to prevent blocking
        console.warn('App not mounted, dismissing splash');
        dismiss();
      }
    };
    
    // Delay check to ensure React has mounted
    const checkTimer = setTimeout(checkMount, 100);
    return () => clearTimeout(checkTimer);
  }, []);

  function dismiss() {
    sessionStorage.setItem("tl_splash_dismissed","1");
    setShow(false);
  }

  if (!show) return null;

  // Emergency unblanking: If shown for >2s, auto-dismiss
  useEffect(() => {
    if (show) {
      const emergency = setTimeout(() => {
        console.warn('Startup splash auto-dismissed (emergency timeout)');
        dismiss();
      }, 2000);
      return () => clearTimeout(emergency);
    }
  }, [show]);

  return (
    <div role="dialog" aria-label="Welcome to TradeLine 24/7" aria-modal="true"
         className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-card/95 border border-border rounded-3xl p-7 max-w-2xl w-full mx-4 text-center animate-scale-in"
           style={{ 
             boxShadow: 'var(--premium-shadow-strong)',
             background: 'linear-gradient(135deg, hsl(var(--card) / 0.98) 0%, hsl(var(--card) / 0.95) 100%)'
           }}
           role="document"
           onClick={dismiss}>
        <img 
          className="w-64 h-auto mx-auto mb-3 block animate-scale-in hover-scale transition-transform duration-300" 
          src="/assets/brand/TRADELEINE_ROBOT_V2.svg" 
          alt="TradeLine 24/7 logo"
          loading="eager"
        />
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground bg-gradient-to-r from-brand-orange-primary to-brand-orange-light bg-clip-text text-transparent">
          Your 24/7 AI Receptionist!
        </h1>
        <p className="text-lg text-muted-foreground mb-3 leading-relaxed">
          Never miss a call. Work while you sleep.
        </p>
        <small className="text-sm text-muted-foreground/80 tracking-wide">
          TradeLine 24/7 • Built with Canadian Excellence
        </small>
      </div>
      
      <style>{`
        /* Respect reduced motion: no animations for users who prefer less motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in, 
          .animate-scale-in, 
          .hover-scale { 
            animation: none !important; 
            transition: none !important;
            transform: none !important;
          }
          .backdrop-blur-sm { 
            backdrop-filter: none !important; 
          }
        }
      `}</style>
    </div>
  );
}