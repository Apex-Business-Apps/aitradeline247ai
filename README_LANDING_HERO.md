# Landing Hero Video

## Overview
Responsive video hero component with autoplay, accessibility, and mobile optimization for the landing page.

## Key Features
- **Autoplay compliance**: Uses `muted + playsInline` attributes for iOS/Safari compatibility
- **Intersection Observer**: Auto-pauses when scrolled out of view for performance
- **Accessibility**: Includes captions, reduced-motion support, and proper ARIA labels
- **Dark mode**: Tailwind dark mode classes with proper contrast
- **Interactive controls**: Mute/unmute toggle and link to interactive demo

## Browser Compatibility

### Autoplay Policies
- **Chrome/Safari**: Requires `muted` and `playsInline` for reliable autoplay
- **Mobile Safari**: `playsInline` prevents fullscreen takeover
- **Fallback**: If autoplay fails, shows poster and allows manual play

### Video Format Support
- **Primary**: WebM (modern browsers, smaller file size)
- **Fallback**: H.264 MP4 (universal compatibility, older Safari)
- **Poster**: JPG/PNG fallback image while loading

## Accessibility Requirements (WCAG)

### 1.2.2 Captions (Prerecorded)
- **Requirement**: All prerecorded audio content must have synchronized captions
- **Implementation**: Include WebVTT (`.vtt`) caption track
- **Testing**: Verify captions display correctly and sync with audio

### 2.3.3 Animation from Interactions
- **Requirement**: Respect `prefers-reduced-motion` setting
- **Implementation**: Pause video if user has motion sensitivity enabled
- **Testing**: Test with OS-level reduced motion settings

## File Structure
```
public/media/landing/
├── demo.webm          # Primary video format (VP9/Opus)
├── demo.mp4           # H.264 fallback for older browsers
├── demo.vtt           # Caption track (WCAG compliance)
└── demo_poster.jpg    # Poster frame (optional)
```

## Dark Mode Implementation
- Uses Tailwind `dark:` prefixes for theme switching
- Ensures proper contrast ratios in both themes
- Video overlay buttons adapt to current theme

## Performance Optimization
- `preload="metadata"` - Loads video info without downloading full file
- Intersection Observer - Pauses when not visible
- Lazy loading - Only starts when element enters viewport
- Efficient formats - WebM preferred for size, MP4 for compatibility

## Mobile Considerations
- **iOS Safari**: Requires `playsInline` to prevent fullscreen behavior
- **Touch targets**: Buttons meet 44px minimum size requirement
- **Responsive**: Video scales appropriately on small screens
- **Bandwidth**: Uses `preload="metadata"` to avoid large downloads on mobile

## Usage in Components
```tsx
import VideoHero from "@/components/VideoHero";
import { DEMO_WEBM, DEMO_MP4, DEMO_VTT, DEMO_POSTER } from "@/lib/media";

<VideoHero 
  webm={DEMO_WEBM} 
  mp4={DEMO_MP4} 
  vtt={DEMO_VTT} 
  poster={DEMO_POSTER}
  className="aspect-video"
/>
```

## Creating Video Assets

### WebM (Recommended)
```bash
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus demo.webm
```

### MP4 Fallback
```bash
ffmpeg -i demo.webm -c:v libx264 -profile:v high -pix_fmt yuv420p -movflags +faststart -crf 22 -preset medium -c:a aac -b:a 128k demo.mp4
```

### Poster Frame
```bash
ffmpeg -i demo.webm -ss 00:00:02 -vframes 1 demo_poster.jpg
```