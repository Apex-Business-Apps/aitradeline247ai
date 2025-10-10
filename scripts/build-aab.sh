#!/usr/bin/env bash
set -euo pipefail

# 0) Web build -> Capacitor sync (Android)
npm ci
npm run build
npx cap sync android   # adds/updates android project

# 1) Put signing secrets in ~/.gradle/gradle.properties (only once)
#   MY_STORE_FILE=/absolute/path/to/upload.keystore
#   MY_STORE_PASSWORD=********
#   MY_KEY_ALIAS=tradeline247-release
#   MY_KEY_PASSWORD=********

# 2) Build the release App Bundle (.aab)
cd android
./gradlew clean bundleRelease --stacktrace

echo "Done. AAB at: android/app/build/outputs/bundle/release/app-release.aab"
