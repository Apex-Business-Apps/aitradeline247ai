#!/usr/bin/env node
/**
 * Build Verification Script
 * 
 * Ensures all assets referenced in dist/index.html exist and have correct MIME types.
 * Prevents .js → text/html misserves in production.
 * 
 * Usage: node scripts/verify-build.cjs
 * Exit 0: All checks passed
 * Exit 1: Verification failed
 */

const fs = require('node:fs');
const path = require('node:path');

const DIST_DIR = path.join(process.cwd(), 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');

const mimeMap = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
};

function log(level, msg) {
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️ ' : '✅';
  console.log(`${prefix} [verify-build] ${msg}`);
}

function extractAssets(html) {
  const assets = [];
  
  // Extract <script src="...">
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (!match[1].startsWith('http')) {
      assets.push({ type: 'script', url: match[1] });
    }
  }
  
  // Extract <link href="...">
  const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    if (!match[1].startsWith('http') && !match[1].startsWith('data:')) {
      assets.push({ type: 'link', url: match[1] });
    }
  }
  
  return assets;
}

function verifyAsset(assetUrl) {
  // Normalize URL (remove leading /)
  const cleanUrl = assetUrl.startsWith('/') ? assetUrl.slice(1) : assetUrl;
  const assetPath = path.join(DIST_DIR, cleanUrl);
  
  // Check existence
  if (!fs.existsSync(assetPath)) {
    return { ok: false, error: 'File not found', path: assetPath };
  }
  
  // Check MIME type by extension
  const ext = path.extname(assetPath).toLowerCase();
  const expectedMime = mimeMap[ext];

  if (!expectedMime) {
    return { ok: true, warning: `Unknown MIME type for ${ext}` };
  }
  
  // Check if file is empty
  const stats = fs.statSync(assetPath);
  if (stats.size === 0) {
    return { ok: true, warning: 'File is empty (0 bytes)', path: assetPath };
  }
  
  // For .js files, verify it's not HTML
  if (ext === '.js') {
    const content = fs.readFileSync(assetPath, 'utf8').slice(0, 500);
    if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html')) {
      return { ok: false, error: '🚨 SCRIPT-SERVED-AS-HTML detected!' };
    }
  }
  
  return { ok: true, mime: expectedMime, size: stats.size };
}

function main() {
  log('info', 'Starting build verification...');
  
  // Check dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    log('error', `dist/ directory not found at ${DIST_DIR}`);
    process.exit(1);
  }
  
  // Check index.html exists
  if (!fs.existsSync(INDEX_PATH)) {
    log('error', 'dist/index.html not found');
    process.exit(1);
  }
  
  log('info', 'Reading dist/index.html...');
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  
  log('info', `Extracting asset references... (HTML size: ${html.length} bytes)`);
  const assets = extractAssets(html);
  
  if (assets.length === 0) {
    log('warn', 'No assets found in index.html (unusual)');
  } else {
    log('info', `Found ${assets.length} asset references`);
  }
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  
  // Verify each asset
  for (const asset of assets) {
    const result = verifyAsset(asset.url);
    
    if (!result.ok) {
      log('error', `${asset.type} "${asset.url}" → ${result.error}`);
      failed++;
    } else if (result.warning) {
      const warningDetails = result.path ? `${result.warning} [${result.path}]` : result.warning;
      log('warn', `${asset.type} "${asset.url}" → ${warningDetails}`);
      warnings++;
      passed++;
    } else {
      log('info', `${asset.type} "${asset.url}" → ${result.mime} (${result.size} bytes)`);
      passed++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  log('info', `Build Verification Complete`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');
  
  if (failed > 0) {
    log('error', 'Build verification FAILED');
    process.exit(1);
  }
  
  log('info', 'Build verification PASSED ✅');
  process.exit(0);
}

main();
