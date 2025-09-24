import React, { useEffect, useState } from "react";

export default function StartupSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // feature flag + one-time per session
    const disabled = import.meta.env.VITE_SPLASH_ENABLED === "false";
    const urlOff = new URLSearchParams(location.search).has("nosplash");
    const seen = sessionStorage.getItem("tl_splash_dismissed") === "1";
    if (disabled || urlOff || seen) return;
    setShow(true);
    const t = setTimeout(() => dismiss(), 1800);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    sessionStorage.setItem("tl_splash_dismissed","1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div role="dialog" aria-label="Welcome to TradeLine 24/7" aria-modal="true"
         className="tl-splash" onClick={dismiss}>
      <div className="tl-splash-card" role="document">
        <img className="tl-logo" src="/assets/brand/OFFICIAL_LOGO.svg" alt="TradeLine 24/7 logo"/>
        <h1>Your 24/7 Ai Receptionist!</h1>
        <p>Never miss a call. Work while you sleep.</p>
        <small>Apex Business Systems • Edmonton, Alberta • Built Canadian</small>
      </div>
      <style>{`
        .tl-splash{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;
          background:rgba(20,20,20,.18);backdrop-filter:blur(2px)}
        .tl-splash-card{background:rgba(255,255,255,.86);border:1px solid #eee;border-radius:24px;
          padding:28px 28px 22px;max-width:720px;width:clamp(280px,80vw,720px);text-align:center;
          box-shadow:0 12px 40px rgba(0,0,0,.12)}
        .tl-logo{width:min(260px,60vw);height:auto;margin:0 auto 10px;display:block;animation:pop .5s ease}
        h1{margin:4px 0 6px;font-size:clamp(22px,4vw,34px);line-height:1.1}
        p{margin:0 0 12px;font-size:clamp(14px,2.6vw,18px);opacity:.9}
        small{opacity:.8}
        @keyframes pop{0%{transform:scale(.96);opacity:.0}100%{transform:scale(1);opacity:1}}
        /* Respect reduced motion: no animations for users who prefer less motion */
        @media (prefers-reduced-motion: reduce){
          .tl-logo{animation:none}
          .tl-splash{backdrop-filter:none}
        }
      `}</style>
    </div>
  );
}