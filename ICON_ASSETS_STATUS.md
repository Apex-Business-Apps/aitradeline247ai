# Icon Assets Status - TradeLine 24/7

## ✅ Completed (ASSETS-01)
- `icon-master-1024.png` - Master icon at 1024×1024
- `icon-ios-1024.png` - Flat iOS version (no transparency)
- `icon-android-foreground-1024.png` - Transparent Android foreground
- `play-icon-512.png` - Google Play Store listing icon

## ⚠️ Partial (ASSETS-02 - Needs Manual Resizing)

The AI image generator has a 512px minimum, so the following files are currently placeholders that need to be properly resized using image editing software (Photoshop, GIMP, or online tools like iloveimg.com):

### Android Adaptive Icons (resize to 432×432):
- `ic_background_432.png` - Solid orange background
- `ic_foreground_432.png` - Transparent foreground
- `ic_monochrome_432.png` - Monochrome themed icon

### Legacy Icons (resize from master to specified sizes):
- `icon-192.png` - 192×192px
- `icon-144.png` - 144×144px
- `icon-96.png` - 96×96px
- `icon-72.png` - 72×72px
- `icon-48.png` - 48×48px

## 🔧 Next Steps

### Manual Resizing Required:
1. Use an image resizer tool to create proper sizes from `icon-master-1024.png`
2. For adaptive icons (432px), ensure safe zones are respected
3. Test legibility of "24/7" text at 48px and 64px
4. If text isn't legible at small sizes, increase stroke weight by 10-15%

### Recommended Tools:
- **Online**: [iLoveIMG](https://www.iloveimg.com/resize-image), [Squoosh](https://squoosh.app/)
- **Desktop**: Photoshop, GIMP, Preview (Mac)
- **Command Line**: ImageMagick (`convert icon-master-1024.png -resize 432x432 output.png`)

## 📱 ANDROID-01 - Capacitor Configuration

The capacitor.config.ts is already configured with proper app icons. Once the icons are properly resized, they'll be used automatically.

Current config:
- App ID: `app.lovable.555a49714138435ea7eedfa3d713d1d3`
- App Name: `TradeLine 24/7`
- Icon: Uses PWA icons at `/assets/pwa-512x512.png`

### To Deploy Icons:
1. Replace the PWA icons with your properly sized adaptive icons
2. Run `npx cap sync` to update native platforms
3. Build and test on emulator

## 🍎 iOS-01 - App Icon Set

iOS requires a full AppIcon.appiconset with multiple sizes. Use Xcode or online generators:

1. Open Xcode
2. Navigate to Assets.xcassets
3. Select AppIcon
4. Drag `icon-ios-1024.png` to the 1024×1024 slot
5. Xcode will generate all required sizes

Or use: [appicon.co](https://www.appicon.co/) to generate the full set.

## 🎨 STORES-01 - Graphics (Not Started)

Still needed:
- Play feature graphic (1024×500px)
- Screenshots (phone + tablet)
- App Store screenshots (6.9" iPhone, 13" iPad)

## Quality Checklist

- [ ] "24/7" text legible at 48px
- [ ] "24/7" text legible at 64px
- [ ] Adaptive foreground respects safe zones (108dp center)
- [ ] Monochrome version is simple silhouette
- [ ] iOS icon has no transparency
- [ ] Play listing icon has no fake shadows
- [ ] All icons tested on device
