#!/usr/bin/env bash
set -euo pipefail
need=(
  public/assets/brand/OFFICIAL_LOGO.svg
  public/assets/brand/BACKGROUND_IMAGE1.svg
  public/assets/brand/BACKGROUND_IMAGE2.svg
  public/assets/brand/BACKGROUND_IMAGE3.svg
  public/assets/brand/BACKGROUND_IMAGE4.svg
  public/assets/brand/BACKGROUND_IMAGE5.svg
  public/assets/brand/BACKGROUND_IMAGE6.svg
  public/assets/brand/App_Icons/favicon.svg
  public/assets/brand/App_Icons/favicon.ico
  public/assets/brand/App_Icons/icon-192.png
  public/assets/brand/App_Icons/icon-512.png
  public/assets/brand/App_Icons/apple-touch-icon.png
  public/assets/fonts/BrandFont.woff2
)
miss=0; for f in "${need[@]}"; do [[ -f "$f" ]] || { echo "MISSING: $f"; miss=1; }; done
[[ $miss -eq 0 ]] && echo "✅ Brand assets OK." || { echo "❌ Brand assets missing."; exit 1; }