#!/usr/bin/env node
// Build asset verification with strictness toggle
// PRs: STRICT_ASSETS=false -> warnings for optional items
// Release: STRICT_ASSETS=true -> fail if optional items missing/empty

const fs = require('fs');
const path = require('path');

const DIST = 'dist';
const STRICT = process.env.STRICT_ASSETS === 'true';

function existsNonEmpty(p) {
  try {
    const s = fs.statSync(p);
    return s.isFile() && s.size > 0;
  } catch { return false; }
}

function info(msg) { console.log(`✅ [verify-build] ${msg}`); }
function warn(msg) { console.warn(`⚠️  [verify-build] ${msg}`); }
function fail(msg) { console.error(`❌ [verify-build] ${msg}`); process.exitCode = 1; }

console.log('✅ [verify-build] Starting build verification...');

const indexHtml = path.join(DIST, 'index.html');
if (!existsNonEmpty(indexHtml)) {
  console.error('❌ [verify-build] dist/index.html missing or empty');
  process.exit(1);
}
info('index.html exists');

// Adjust these if your bundler output names differ:
const mustHave = [
  path.join(DIST, 'assets', 'index.css'),
  path.join(DIST, 'assets', 'index.js'),
];
for (const f of mustHave) {
  if (!existsNonEmpty(f)) {
    const msg = `${path.basename(f)} missing or empty`;
    STRICT ? fail(msg) : warn(msg);
  } else {
    info(`${path.basename(f)} exists`);
  }
}

const font = path.join(DIST, 'assets', 'fonts', 'BrandFont.woff2');
if (!existsNonEmpty(font)) {
  const msg = 'BrandFont.woff2 missing or empty';
  STRICT ? fail(msg) : warn(msg);
} else {
  info('BrandFont.woff2 present and non-empty');
}

const manifest = path.join(DIST, 'manifest.webmanifest');
if (!existsNonEmpty(manifest)) {
  const msg = 'manifest.webmanifest missing or empty';
  STRICT ? fail(msg) : warn(msg);
} else {
  info('manifest.webmanifest exists');
}

console.log('\n============================================================');
if (process.exitCode === 1) {
  console.log('❌ [verify-build] Build verification FAILED');
  process.exit(1);
}
console.log('✅ [verify-build] Build verification PASSED');
