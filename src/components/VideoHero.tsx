import { useEffect, useRef, useState } from "react";

type Props = { 
  webm: string; 
  mp4?: string; 
  vtt?: string; 
  poster?: string; 
  className?: string 
};

export default function VideoHero({ webm, mp4, vtt, poster, className }: Props) {
  const vref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = vref.current; 
    if (!el) return;
    
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { 
      threshold: 0.3 
    });
    io.observe(el); 
    
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = vref.current; 
    if (!el) return;
    
    if (visible) {
      el.play().catch(() => {
        // Autoplay failed, likely due to browser policy
        console.log('Autoplay prevented - user interaction required');
      });
    } else {
      el.pause();
    }
  }, [visible]);

  // Respect reduced-motion preference
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (m.matches) {
      vref.current?.pause();
    }
  }, []);

  const toggleMute = () => {
    const el = vref.current;
    if (!el) return;
    
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 ${className || ""}`}>
      <video
        ref={vref}
        className="w-full h-full object-cover"
        poster={poster}
        playsInline     // iOS/Safari inline playback
        muted           // Required for autoplay policies
        loop
        preload="metadata"
        aria-label="Product demo video"
      >
        <source src={webm} type="video/webm" />
        {mp4 && <source src={mp4} type="video/mp4" />}
        {vtt && <track kind="captions" src={vtt} srcLang="en" label="English" default />}
      </video>
      
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          className="rounded-md bg-white/90 px-3 py-1.5 text-xs shadow dark:bg-neutral-900/90 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          aria-label={muted ? "Unmute video" : "Mute video"}
          onClick={toggleMute}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <a 
          href="/demo/dashboard" 
          className="rounded-md bg-black text-white px-3 py-1.5 text-xs shadow dark:bg-white dark:text-black hover:opacity-90 transition-opacity" 
          aria-label="Open interactive demo"
        >
          Try interactive
        </a>
      </div>
    </div>
  );
}