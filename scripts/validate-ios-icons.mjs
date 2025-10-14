#!/usr/bin/env node
/**
 * APPLE•5 — iOS Icon Validation (Pre-Submit Gate)
 * Validates all icons meet Apple's requirements
 * Usage: npm run validate:ios-icons
 */

import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const requiredIcons = [
  { filename: 'icon-1024.png', size: 1024, requireNoAlpha: true, critical: true },
  { filename: 'icon-180.png', size: 180 },
  { filename: 'icon-120.png', size: 120 },
  { filename: 'icon-167.png', size: 167 },
  { filename: 'icon-152.png', size: 152 },
  { filename: 'icon-76.png', size: 76 },
  { filename: 'icon-60.png', size: 60 },
  { filename: 'icon-40.png', size: 40 },
  { filename: 'icon-29.png', size: 29 },
];

const iconDir = join(projectRoot, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');

async function validateIcon(filename, size, requireNoAlpha) {
  const path = join(iconDir, filename);
  
  if (!existsSync(path)) {
    return { filename, status: '❌ MISSING', pass: false };
  }
  
  try {
    const buffer = readFileSync(path);
    const metadata = await sharp(buffer).metadata();
    
    const errors = [];
    
    // Check format
    if (metadata.format !== 'png') {
      errors.push('Not PNG');
    }
    
    // Check dimensions
    if (metadata.width !== size || metadata.height !== size) {
      errors.push(`Wrong size: ${metadata.width}x${metadata.height}`);
    }
    
    // Check color space (should be sRGB)
    if (metadata.space !== 'srgb') {
      errors.push(`Wrong color space: ${metadata.space}`);
    }
    
    // Check alpha channel
    if (requireNoAlpha && metadata.hasAlpha) {
      errors.push('Has alpha (marketing icon must have no alpha)');
    }
    
    if (errors.length > 0) {
      return { filename, status: `❌ ${errors.join(', ')}`, pass: false };
    }
    
    return { filename, status: '✅ PASS', pass: true };
  } catch (err) {
    return { filename, status: `❌ Error: ${err.message}`, pass: false };
  }
}

async function main() {
  console.log('🍎 APPLE•5 — iOS Icon Validation\n');
  
  if (!existsSync(iconDir)) {
    console.error(`❌ Icon directory not found: ${iconDir}`);
    console.error('   Run: npm run gen:ios-icons first\n');
    process.exit(1);
  }
  
  console.log('🔍 Validating icons...\n');
  console.log('┌─────────────────────────┬────────────────────────────────────────────────────────────────┐');
  console.log('│ Filename                │ Status                                                         │');
  console.log('├─────────────────────────┼────────────────────────────────────────────────────────────────┤');
  
  let allPass = true;
  
  for (const { filename, size, requireNoAlpha, critical } of requiredIcons) {
    const result = await validateIcon(filename, size, requireNoAlpha);
    
    if (!result.pass) {
      allPass = false;
      if (critical) {
        console.log(`│ ${filename.padEnd(23)} │ ${result.status.padEnd(62)} CRITICAL │`);
      } else {
        console.log(`│ ${filename.padEnd(23)} │ ${result.status.padEnd(62)} │`);
      }
    } else {
      console.log(`│ ${filename.padEnd(23)} │ ${result.status.padEnd(62)} │`);
    }
  }
  
  console.log('└─────────────────────────┴────────────────────────────────────────────────────────────────┘\n');
  
  if (allPass) {
    console.log('✅ All icons PASS validation!\n');
    console.log('📱 Ready for Xcode archive and App Store submission.\n');
    process.exit(0);
  } else {
    console.log('❌ Some icons FAILED validation.\n');
    console.log('🔧 Fix errors and run: npm run gen:ios-icons\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
