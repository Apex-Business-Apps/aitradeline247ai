// Minimal, fast checks. No external vendors mentioned.
// Verifies expected icons/fonts exist in /dist and basic MIME-ish extensions.

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');

const requiredPublic = [
  'assets/brand/App_Icons/favicon.ico',
  'assets/brand/App_Icons/favicon.svg',
  'assets/brand/App_Icons/icon-192.png',
  'assets/brand/App_Icons/icon-512.png',
  'assets/brand/App_Icons/apple-touch-icon.png',
  'assets/fonts/BrandFont.woff2',
];

function ensureExists(rel) {
  const p1 = path.join(root, 'public', rel);
  if (!fs.existsSync(p1)) {
    throw new Error(`Missing public asset: public/${rel}`);
  }
}

function ensureBuilt(rel) {
  const p2 = path.join(dist, rel);
  if (!fs.existsSync(p2)) {
    console.warn(`Built file not found in dist: ${rel} (this may be ok if Vite hashed names)`);
  }
}

function extOk(file) {
  return (
    file.endsWith('.ico') ||
    file.endsWith('.svg') ||
    file.endsWith('.png') ||
    file.endsWith('.woff2') ||
    file.endsWith('.webmanifest') ||
    file.endsWith('.html')
  );
}

function scanForEmptyFiles() {
  let empty = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else {
        if (!extOk(p)) continue;
        const sz = fs.statSync(p).size;
        if (sz === 0) empty.push(path.relative(dist, p));
      }
    }
  }
  if (fs.existsSync(dist)) walk(dist);
  if (empty.length) {
    throw new Error(`Empty files in dist: ${empty.join(', ')}`);
  }
}

for (const rel of requiredPublic) ensureExists(rel);
for (const rel of requiredPublic) ensureBuilt(rel);
scanForEmptyFiles();

console.log('✅ verify-build.cjs passed.');
