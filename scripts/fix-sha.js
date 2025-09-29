// scripts/fix-sha.js
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
const buf = readFileSync('public/download/release.tar.gz');
const hex = createHash('sha256').update(buf).digest('hex');
writeFileSync('public/download/release.tar.gz.sha256', hex);
console.log(hex);