# scripts/one_shot_fix.sh
#!/usr/bin/env bash
set -euo pipefail

# ===== Config (provided) =====
BUNDLE_ID="com.apex.tradeline"
TEAM_ID="NWGUYF42KW"
APP_NAME="TradeLine247"
APP_VERSION="1.0.0"
XCODE_WORKSPACE="ios/App/App.xcworkspace"
XCODE_SCHEME="App"

# ===== Helpers =====
log() { printf "\n[%s] %s\n" "$(date +%H:%M:%S)" "$*"; }
die() { printf "\nERROR: %s\n" "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "Missing tool: $1"; }

plist_set() {
  /usr/libexec/PlistBuddy -c "$1" "$2" >/dev/null 2>&1 || true
}

check_png_size() {
  local file="$1" w h
  w=$(sips -g pixelWidth "$file" 2>/dev/null | awk '/pixelWidth/ {print $2}')
  h=$(sips -g pixelHeight "$file" 2>/dev/null | awk '/pixelHeight/ {print $2}')
  [ "${w}" = "$2" ] && [ "${h}" = "$3" ] || die "Icon $file must be ${2}x${3}, got ${w}x${h}"
}

flatten_png_no_alpha() {
  local src="$1"
  if command -v convert >/dev/null 2>&1; then
    # Remove alpha by compositing on white
    convert "$src" -background white -alpha remove -alpha off "$src"
  else
    # Fallback: re-encode with sips, then verify there is no alpha channel by forcing white matte via imagemagick absence warning
    # If convert is not available, this may not remove alpha on some images.
    log "ImageMagick 'convert' not found; attempting sips re-encode (may not remove alpha reliably)."
    sips -s format png "$src" --out "$src" >/dev/null
  fi
}

backup_once() {
  local path="$1"
  [ -f "$path" ] && cp -n "$path" "$path.bak" || true
}

dryrun_notice() {
  cat <<EOF
Dry run plan:
- Sanitize package.json scripts.
- npm ci, build with NPM_CONFIG_IGNORE_SCRIPTS.
- Verify assets (if scripts exist).
- Capacitor sync ios.
- Force iOS 15.0 target in project and Podfile; pod install.
- Set Info.plist versions and iPhone-only; strip iPad icon keys.
- Validate capacitor.config.json and public/ presence.
- Rebuild AppIcon.appiconset (iPhone only), remove alpha, validate sizes.
- Local archive and export IPA using App Store profile for ${BUNDLE_ID}.
- Summarize changes and outputs.
EOF
}

# ===== Parse flags =====
DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
fi

# ===== Tool checks =====
log "Checking required tools"
need node
need npm
need xcodebuild
need pod
need sips
# convert (ImageMagick) is optional; used if present

NODE_V=$(node -v || true)
NPM_V=$(npm -v || true)
log "Node: ${NODE_V} (expect v20.11.1), npm: ${NPM_V} (expect 10.x)"

if [ $DRY_RUN -eq 1 ]; then
  dryrun_notice
  exit 0
fi

# ===== Sanitize package.json =====
log "Sanitizing package.json (remove lifecycle and capacitor sync hooks)"
backup_once package.json
node --input-type=module -e "
import fs from 'fs';
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts = p.scripts || {};
for (const k of ['prebuild','postbuild','capacitor:sync:before','capacitor:sync:after']) {
  if (p.scripts[k]) delete p.scripts[k];
}
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
"

# ===== Install and build web =====
log "Installing dependencies"
npm ci --no-audit --no-fund

log "Building web (ignoring lifecycle hooks)"
NPM_CONFIG_IGNORE_SCRIPTS=true npm run build

# ===== Verify assets (best-effort) =====
if [ -f scripts/verify-app.cjs ]; then
  log "Verifying app (scripts/verify-app.cjs)"
  node scripts/verify-app.cjs || log "verify-app.cjs reported issues"
else
  log "Missing scripts/verify-app.cjs; continuing"
fi

if [ -f scripts/verify_icons.mjs ]; then
  log "Verifying icons (scripts/verify_icons.mjs)"
  node scripts/verify_icons.mjs || log "verify_icons.mjs reported issues"
else
  log "Missing scripts/verify_icons.mjs; continuing"
fi

# ===== Capacitor sync =====
log "Sync Capacitor iOS"
npx cap sync ios

# ===== Force iOS target 15.0 and iPhone-only at project level =====
PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"
PODFILE="ios/App/Podfile"

[ -f "$PBXPROJ" ] || die "Missing $PBXPROJ"
[ -f "$PODFILE" ] || die "Missing $PODFILE"

log "Applying IPHONEOS_DEPLOYMENT_TARGET=15.0 and TARGETED_DEVICE_FAMILY=1 in project"
backup_once "$PBXPROJ"
# Set iOS min version
LC_ALL=C sed -i '' -E 's/(IPHONEOS_DEPLOYMENT_TARGET = )[0-9.]+;/\115.0;/g' "$PBXPROJ"
# Force iPhone-only targeted device family
LC_ALL=C sed -i '' -E 's/(TARGETED_DEVICE_FAMILY = )\"?1, ?2\"?;/\11;/g' "$PBXPROJ"
LC_ALL=C sed -i '' -E 's/(TARGETED_DEVICE_FAMILY = )2;/\11;/g' "$PBXPROJ"
# If not present, add under build settings blocks (best-effort)
grep -q "TARGETED_DEVICE_FAMILY = 1;" "$PBXPROJ" || LC_ALL=C sed -i '' -E 's/(buildSettings = \{)/\1\n\t\t\t\t\tTARGETED_DEVICE_FAMILY = 1;/' "$PBXPROJ"

log "Setting platform :ios, '15.0' in Podfile and installing pods"
backup_once "$PODFILE"
if grep -qE "^platform :ios" "$PODFILE"; then
  LC_ALL=C sed -i '' -E "s/^platform :ios, *'[0-9.]+'$/platform :ios, '15.0'/" "$PODFILE"
else
  printf "platform :ios, '15.0'\n%s" "$(cat "$PODFILE")" > "$PODFILE.tmp" && mv "$PODFILE.tmp" "$PODFILE"
fi
( cd ios/App && pod install --repo-update )

# ===== Info.plist: versions, iPhone-only, strip iPad icon keys =====
PLIST="ios/App/App/Info.plist"
[ -f "$PLIST" ] || die "Missing $PLIST"
log "Updating Info.plist"
plist_set "Set :CFBundleShortVersionString ${APP_VERSION}" "$PLIST"
APP_BUILD="$(date +%y%m%d%H)"
plist_set "Set :CFBundleVersion ${APP_BUILD}" "$PLIST"
# Remove explicit iPad icons and enforce iPhone-only UI device family in plist (project-level device family already set)
plist_set "Delete :CFBundleIcons~ipad" "$PLIST"
plist_set "Delete :CFBundleIcons":dict "$PLIST" # harmless if absent
# Optionally ensure UIDeviceFamily = [1]
plist_set "Delete :UIDeviceFamily" "$PLIST"
plist_set "Add :UIDeviceFamily array" "$PLIST"
plist_set "Add :UIDeviceFamily:0 integer 1" "$PLIST"

# ===== Guards for Capacitor ios app assets =====
log "Validating Capacitor iOS app assets"
[ -f ios/App/App/capacitor.config.json ] || die "Missing ios/App/App/capacitor.config.json"
[ -d ios/App/App/public ] || die "Missing ios/App/App/public (web assets). Check Vite outDir and Capacitor webDir."

# ===== Icons: validate and rebuild AppIcon.appiconset =====
SRC_DIR="public/assets/brand/App_Icons/ios"
APPSTORE="$SRC_DIR/AppStore1024.png"
PHONE180="$SRC_DIR/iPhoneApp180.png"
SPOT120="$SRC_DIR/iPhoneSpotlight120.png"

log "Checking icon sources"
[ -f "$APPSTORE" ] || die "Missing $APPSTORE"
[ -f "$PHONE180" ] || die "Missing $PHONE180"
[ -f "$SPOT120" ] || die "Missing $SPOT120"

check_png_size "$APPSTORE" 1024 1024
check_png_size "$PHONE180" 180 180
check_png_size "$SPOT120" 120 120

log "Flattening icons to remove alpha (if any)"
flatten_png_no_alpha "$APPSTORE"
flatten_png_no_alpha "$PHONE180"
flatten_png_no_alpha "$SPOT120"

AC_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"
log "Writing AppIcon.appiconset (iPhone only) to $AC_DIR"
mkdir -p "$AC_DIR"
backup_once "$AC_DIR/Contents.json"
cp -f "$APPSTORE" "$AC_DIR/AppStore1024.png"
cp -f "$PHONE180" "$AC_DIR/iPhoneApp180.png"
cp -f "$SPOT120" "$AC_DIR/iPhoneSpotlight120.png"
cat > "$AC_DIR/Contents.json" <<'JSON'
{
  "images": [
    { "idiom": "iphone", "size": "60x60", "scale": "3x", "filename": "iPhoneApp180.png" },
    { "idiom": "iphone", "size": "40x40", "scale": "3x", "filename": "iPhoneSpotlight120.png" },
    { "idiom": "ios-marketing", "size": "1024x1024", "scale": "1x", "filename": "AppStore1024.png" }
  ],
  "info": { "version": 1, "author": "one_shot_fix" }
}
JSON

# ===== Local archive and export to prove pipeline =====
log "Archiving Xcode project locally (Release)"
ARCHIVE_PATH="$(pwd)/local_export/${APP_NAME}.xcarchive"
EXPORT_DIR="$(pwd)/local_export"
mkdir -p "$EXPORT_DIR"

xcodebuild -workspace "$XCODE_WORKSPACE" \
  -scheme "$XCODE_SCHEME" \
  -configuration Release \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  clean archive

log "Detecting App Store provisioning profile for ${BUNDLE_ID}"
PROFILE_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
[ -d "$PROFILE_DIR" ] || die "No provisioning profiles found at $PROFILE_DIR"
PROFILE_NAME=""
for f in "$PROFILE_DIR"/*.mobileprovision; do
  [ -e "$f" ] || continue
  PL=$(/usr/bin/security cms -D -i "$f")
  BID=$(/usr/libexec/PlistBuddy -c "Print :Entitlements:application-identifier" /dev/stdin <<<"$PL" 2>/dev/null | sed "s/^[A-Z0-9]*\.//")
  HAS_DEVICES=$(/usr/libexec/PlistBuddy -c "Print :ProvisionedDevices" /dev/stdin <<<"$PL" 2>/dev/null && echo yes || echo no)
  ALL_DEVICES=$(/usr/libexec/PlistBuddy -c "Print :ProvisionsAllDevices" /dev/stdin <<<"$PL" 2>/dev/null && echo yes || echo no)
  NAME=$(/usr/libexec/PlistBuddy -c "Print :Name" /dev/stdin <<<"$PL" 2>/dev/null)
  if [ "$BID" = "$BUNDLE_ID" ] && [ "$HAS_DEVICES" = "no" ] && [ "$ALL_DEVICES" = "no" ]; then
    PROFILE_NAME="$NAME"; break
  fi
done
[ -n "$PROFILE_NAME" ] || die "No App Store profile found for $BUNDLE_ID"

log "Exporting IPA with explicit provisioning profile: $PROFILE_NAME"
cat > "$EXPORT_DIR/exportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store</string>
  <key>teamID</key><string>${TEAM_ID}</string>
  <key>stripSwiftSymbols</key><true/>
  <key>compileBitcode</key><false/>
  <key>provisioningProfiles</key>
  <dict>
    <key>${BUNDLE_ID}</key><string>${PROFILE_NAME}</string>
  </dict>
</dict>
</plist>
PLIST

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_DIR/exportOptions.plist" \
  -exportPath "$EXPORT_DIR"

[ -f "$EXPORT_DIR/${APP_NAME}.ipa" ] || [ -f "$EXPORT_DIR/App.ipa" ] || die "Exported IPA not found in $EXPORT_DIR"

log "DONE. Local export at: $EXPORT_DIR"
log "Build: ${APP_VERSION} (${APP_BUILD}) for ${BUNDLE_ID}"
git status --porcelain || true
