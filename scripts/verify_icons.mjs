#!/usr/bin/env node
import fs from "fs";
const must = [
  "public/assets/brand/App_Icons/icon-192.png",
  "public/assets/brand/App_Icons/icon-512.png",
  "public/assets/brand/App_Icons/maskable-192.png",
  "public/assets/brand/App_Icons/maskable-512.png",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png"
];
let missing = [];
for (const p of must) if (!fs.existsSync(p)) missing.push(p);
if (missing.length) {
  console.error("? Missing required icons:\n" + missing.join("\n"));
  process.exit(1);
}
console.log("? Icons present");