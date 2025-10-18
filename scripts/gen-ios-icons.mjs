#!/usr/bin/env node
/**
 * APPLE•2 — iOS Icon Generator (Idempotent)
 * Generates all required iOS AppIcon sizes from master SVG
 * Usage: npm run gen:ios-icons
 */

import sharp from 'sharp';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// iOS AppIcon sizes (no alpha for 1024 marketing icon)
const sizes = [
  { size: 1024, filename: 'icon-1024.png', idiom: 'ios-marketing', stripAlpha: true },
  { size: 180, filename: 'icon-180.png', idiom: 'iphone' },
  { size: 120, filename: 'icon-120.png', idiom: 'iphone' },
  { size: 167, filename: 'icon-167.png', idiom: 'ipad' },
  { size: 152, filename: 'icon-152.png', idiom: 'ipad' },
  { size: 76, filename: 'icon-76.png', idiom: 'ipad' },
  { size: 60, filename: 'icon-60.png', idiom: 'iphone' },
  { size: 40, filename: 'icon-40.png', idiom: 'iphone' },
  { size: 29, filename: 'icon-29.png', idiom: 'ipad' },
  { size: 87, filename: 'icon-87.png', idiom: 'iphone' },
  { size: 58, filename: 'icon-58.png', idiom: 'iphone' },
  { size: 80, filename: 'icon-80.png', idiom: 'iphone' },
  { size: 20, filename: 'icon-20.png', idiom: 'ipad' },
  { size: 40, filename: 'icon-40-ipad.png', idiom: 'ipad' },
  { size: 58, filename: 'icon-58-ipad.png', idiom: 'ipad' },
  { size: 40, filename: 'icon-40-ipad-1x.png', idiom: 'ipad' },
  { size: 80, filename: 'icon-80-ipad.png', idiom: 'ipad' },
  { size: 120, filename: 'icon-120-small.png', idiom: 'iphone' },
];

const masterSvgPath = join(projectRoot, 'public/assets/brand/icon_master.svg');
const outputDir = join(projectRoot, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');

function calculateSHA256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function generateIcon(size, filename, stripAlpha) {
  const outputPath = join(outputDir, filename);
  
  // Read master SVG
  const svgBuffer = readFileSync(masterSvgPath);
  
  // Generate PNG with sharp
  let pipeline = sharp(svgBuffer)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 179, b: 71, alpha: stripAlpha ? 1 : 0 }
    })
    .png({ compressionLevel: 9, palette: false });
  
  // Strip alpha for marketing icon (1024)
  if (stripAlpha) {
    pipeline = pipeline.removeAlpha();
  }
  
  const outputBuffer = await pipeline.toBuffer();
  const outputHash = calculateSHA256(outputBuffer);
  
  // Idempotency check: skip if identical file exists
  if (existsSync(outputPath)) {
    const existingBuffer = readFileSync(outputPath);
    const existingHash = calculateSHA256(existingBuffer);
    
    if (existingHash === outputHash) {
      return { filename, size, skipped: true, hash: outputHash };
    }
  }
  
  // Write new file
  writeFileSync(outputPath, outputBuffer);
  
  return {
    filename,
    size: `${size}x${size}`,
    bytes: outputBuffer.length,
    hash: outputHash,
    skipped: false
  };
}

async function main() {
  console.log('🍎 APPLE•2 — iOS Icon Generator\n');
  
  // Validate master SVG
  if (!existsSync(masterSvgPath)) {
    console.error(`❌ Master SVG not found: ${masterSvgPath}`);
    process.exit(1);
  }
  
  const svgContent = readFileSync(masterSvgPath, 'utf-8');
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  
  if (!viewBoxMatch) {
    console.error('❌ No viewBox found in master SVG');
    process.exit(1);
  }
  
  const viewBox = viewBoxMatch[1];
  const [vbX, vbY, vbW, vbH] = viewBox.split(' ').map(Number);
  
  console.log(`📐 Master SVG: ${masterSvgPath}`);
  console.log(`   ViewBox: ${viewBox}`);
  console.log(`   SHA256: ${calculateSHA256(readFileSync(masterSvgPath))}\n`);
  
  if (vbW !== 1024 || vbH !== 1024) {
    console.warn(`⚠️  ViewBox is not square 1024x1024. Fit: contain with brand background.\n`);
  }
  
  // Create output directory
  mkdirSync(outputDir, { recursive: true });
  
  // Generate all icons
  console.log('🔨 Generating icons...\n');
  console.log('┌─────────────────────────┬────────────┬──────────┬──────────────────────────────────────────────────────────────────────┐');
  console.log('│ Filename                │ Size       │ Bytes    │ SHA256                                                               │');
  console.log('├─────────────────────────┼────────────┼──────────┼──────────────────────────────────────────────────────────────────────┤');
  
  for (const { size, filename, stripAlpha } of sizes) {
    const result = await generateIcon(size, filename, stripAlpha);
    
    const status = result.skipped ? '✓ no-op' : '✓ wrote';
    const sizeStr = result.size.padEnd(10);
    const bytesStr = result.skipped ? 'skipped'.padEnd(8) : result.bytes.toString().padEnd(8);
    const filenameStr = filename.padEnd(23);
    
    console.log(`│ ${filenameStr} │ ${sizeStr} │ ${bytesStr} │ ${result.hash} ${status} │`);
  }
  
  console.log('└─────────────────────────┴────────────┴──────────┴──────────────────────────────────────────────────────────────────────┘');
  
  console.log('\n✅ Icon generation complete!');
  console.log(`📁 Output: ${outputDir}`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
