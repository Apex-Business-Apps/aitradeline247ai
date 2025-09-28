// Media asset paths for landing page and demos
export const DEMO_WEBM = "/media/landing/demo.webm";
export const DEMO_MP4 = "/media/landing/demo.mp4";        // Optional H.264 fallback
export const DEMO_VTT = "/media/landing/demo.vtt";         // Captions track
export const DEMO_POSTER = "/media/landing/demo_poster.jpg"; // Optional poster frame

// Hero video configuration
export const HERO_VIDEO_CONFIG = {
  webm: DEMO_WEBM,
  mp4: DEMO_MP4,
  vtt: DEMO_VTT,
  poster: DEMO_POSTER,
  preload: 'metadata' as const,
  playsInline: true,
  muted: true,
  loop: true,
  autoplay: true
};

// Intersection Observer config for video autoplay
export const VIDEO_OBSERVER_CONFIG = {
  threshold: 0.3,
  rootMargin: '0px 0px -100px 0px'
};