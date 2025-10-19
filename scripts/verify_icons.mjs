#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const mustExist = [
  "public/assets/brand/icon_master.svg",                         // master
  "public/assets/brand/App_Icons/icon-192.png",
  "public/assets/brand/App_Icons/icon-512.png",
  "public/assets/brand/App_Icons/maskable-192.png",
  "public/assets/brand/App_Icons/maskable-512.png",
  "public/assets/brand/App_Icons/ios/iPhoneApp180.png",
  "public/assets/brand/App_Icons/ios/iPhoneSpotlight120.png",
  "public/assets/brand/App_Icons/ios/iPadApp152.png",
  "public/assets/brand/App_Icons/ios/iPadApp167.png",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png"
];

let miss = 0;
for (const f of mustExist) {
  if (!fs.existsSync(f)) { console.error("MISSING:", f); miss = 1; }
}

// quick PNG dim check (requires ImageMagick identify; skip if absent)
function size(p) {
  try { return execSync(`identify -format %wx%h ${p}`).toString().trim(); }
  catch { return "unknown"; }
}
const dimChecks = {
  "public/assets/brand/App_Icons/icon-192.png": "192x192",
  "public/assets/brand/App_Icons/icon-512.png": "512x512",
  "public/assets/brand/App_Icons/maskable-192.png": "192x192",
  "public/assets/brand/App_Icons/maskable-512.png": "512x512",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png": "1024x1024"
};
for (const [p, want] of Object.entries(dimChecks)) {
  if (!fs.existsSync(p)) continue;
  const got = size(p);
  if (got !== "unknown" && got !== want) {
    console.error(`BAD_SIZE: ${p} -> ${got} (want ${want})`); miss = 1;
  }
}

if (miss) {
  console.error("❌ Icon verification failed.");
  process.exit(1);
}
console.log("✅ Icon set verified.");
