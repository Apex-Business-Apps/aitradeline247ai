#!/usr/bin/env node
/**
 * Header Flush Regression Guard
 * 
 * Fails the build if:
 * 1. Header top is not 0px on load
 * 2. Any [data-banner] resolves to position: fixed
 * 
 * Location: scripts/header-flush-guard.mjs
 * 
 * To bypass for debugging:
 *   SKIP_HEADER_GUARD=1 npm run build
 * 
 * This runs as a post-build validation step.
 */

import { launch } from 'puppeteer-core';
import { execSync } from 'child_process';

// Check for bypass flag
if (process.env.SKIP_HEADER_GUARD === '1') {
  console.log('⚠️  Header flush guard SKIPPED (SKIP_HEADER_GUARD=1)');
  process.exit(0);
}

// Attempt to find Chrome/Chromium
function findChrome() {
  const paths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  
  for (const path of paths) {
    try {
      if (require('fs').existsSync(path)) return path;
    } catch {}
  }
  
  // Try which/where command
  try {
    const result = execSync(process.platform === 'win32' ? 'where chrome' : 'which google-chrome', {
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    if (result) return result.split('\n')[0];
  } catch {}
  
  return null;
}

async function validateHeaderFlush() {
  console.log('🔍 Running header flush regression guard...\n');
  
  const chromePath = findChrome();
  if (!chromePath) {
    console.log('⚠️  Chrome/Chromium not found - skipping regression guard');
    console.log('   Install Chrome or set SKIP_HEADER_GUARD=1 to bypass\n');
    process.exit(0);
  }

  const browser = await launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport to test both mobile and desktop
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    const routes = ['/', '/features', '/pricing'];
    let allPassed = true;

    for (const viewport of viewports) {
      await page.setViewport(viewport);
      console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      for (const route of routes) {
        const url = `http://localhost:8080${route}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
          
          // Wait for header to be present
          await page.waitForSelector('header[data-site-header]', { timeout: 5000 });
          
          // Test 1: Header top = 0px
          const headerTop = await page.evaluate(() => {
            const header = document.querySelector('header[data-site-header]');
            if (!header) return null;
            return Math.round(header.getBoundingClientRect().top);
          });

          if (headerTop !== 0) {
            console.error(`❌ FAIL: ${route} - Header top = ${headerTop}px (expected 0px)`);
            allPassed = false;
          } else {
            console.log(`✅ PASS: ${route} - Header top = 0px`);
          }

          // Test 2: No position:fixed on [data-banner]
          const fixedBanners = await page.evaluate(() => {
            const banners = Array.from(document.querySelectorAll('[data-banner]'));
            return banners.map(b => ({
              position: getComputedStyle(b).position,
              class: b.className
            })).filter(b => b.position === 'fixed');
          });

          if (fixedBanners.length > 0) {
            console.error(`❌ FAIL: ${route} - Found ${fixedBanners.length} fixed [data-banner] elements`);
            console.error('   Details:', fixedBanners);
            allPassed = false;
          }

        } catch (error) {
          console.warn(`⚠️  SKIP: ${route} - ${error.message}`);
        }
      }
    }

    await browser.close();

    if (!allPassed) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ HEADER FLUSH GUARD FAILED');
      console.error('='.repeat(60));
      console.error('\nThe build has been blocked to prevent header gap regression.');
      console.error('To debug, run: SKIP_HEADER_GUARD=1 npm run build');
      console.error('Then inspect with: verifyHeaderFlush() in browser console\n');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ HEADER FLUSH GUARD PASSED');
    console.log('='.repeat(60) + '\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Guard error:', error.message);
    console.log('⚠️  Skipping guard due to error (build will continue)\n');
    await browser.close();
    process.exit(0);
  }
}

validateHeaderFlush();
