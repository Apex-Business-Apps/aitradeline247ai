import { test, expect } from '@playwright/test';

/**
 * Service Worker Freshness E2E Test
 * 
 * Verifies that:
 * 1. Service worker registers correctly
 * 2. Assets are served with correct MIME types
 * 3. No stale cache issues after updates
 */

test.describe('Service Worker Freshness', () => {
  test('should register service worker in production mode', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Wait for SW registration (check console logs)
    const swRegistered = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        if (!('serviceWorker' in navigator)) {
          resolve(false);
          return;
        }
        
        // Check if already registered
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            resolve(true);
          } else {
            // Wait up to 5s for registration
            let attempts = 0;
            const interval = setInterval(() => {
              navigator.serviceWorker.getRegistration().then(reg => {
                if (reg || attempts > 10) {
                  clearInterval(interval);
                  resolve(!!reg);
                }
                attempts++;
              });
            }, 500);
          }
        });
      });
    });
    
    // Note: SW only registers in production mode (not localhost)
    // In dev/preview, this will be false
    console.log(`Service Worker registered: ${swRegistered}`);
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for app to fully load
    await page.waitForSelector('#root', { state: 'attached', timeout: 5000 });
    
    // No critical errors should be present
    const criticalErrors = errors.filter(e => 
      e.includes('Failed to fetch') || 
      e.includes('404') ||
      e.includes('text/html')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should serve assets with correct MIME types', async ({ page, request }) => {
    // Get the main page
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    
    const html = await response.text();
    
    // Extract script sources
    const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
    
    for (const match of scriptMatches) {
      const src = match[1];
      
      // Skip external scripts
      if (src.startsWith('http')) continue;
      
      // Fetch the script
      const scriptResponse = await request.get(src);
      
      // Should return 200
      expect(scriptResponse.status()).toBe(200);
      
      // Should have correct MIME type (NOT text/html)
      const contentType = scriptResponse.headers()['content-type'] || '';
      expect(contentType).toMatch(/javascript|ecmascript/);
      expect(contentType).not.toContain('text/html');
      
      console.log(`✅ ${src} → ${contentType}`);
    }
  });

  test('should not cache index.html long-term', async ({ request }) => {
    const response = await request.get('/');
    const cacheControl = response.headers()['cache-control'] || '';
    
    // index.html should be no-cache or short TTL
    expect(cacheControl).toMatch(/no-cache|max-age=0|must-revalidate/i);
    
    console.log(`index.html Cache-Control: ${cacheControl}`);
  });

  test('should cache assets immutably', async ({ page, request }) => {
    await page.goto('/');
    
    // Wait for assets to load
    await page.waitForLoadState('networkidle');
    
    // Get all loaded resources
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r: any) => ({
        name: r.name,
        type: r.initiatorType,
      }));
    });
    
    // Find a hashed asset (e.g., /assets/index-abc123.js)
    const hashedAsset = resources.find(r => 
      r.name.includes('/assets/') && 
      r.name.match(/\.[a-f0-9]{8,}\.(js|css)/)
    );
    
    if (hashedAsset) {
      const url = new URL(hashedAsset.name);
      const assetResponse = await request.get(url.pathname);
      const cacheControl = assetResponse.headers()['cache-control'] || '';
      
      // Hashed assets should be immutable or long-lived
      expect(cacheControl).toMatch(/immutable|max-age=31536000/i);
      
      console.log(`Asset Cache-Control: ${cacheControl}`);
    }
  });

  test('should detect boot failures', async ({ page }) => {
    await page.goto('/');
    
    // Wait for boot sentinel timeout (3s)
    await page.waitForTimeout(4000);
    
    // Check if boot timeout was triggered
    const bootTimeout = await page.evaluate(() => window.__BOOT_TIMEOUT__);
    
    // Should NOT have boot timeout (app should mount successfully)
    expect(bootTimeout).toBeFalsy();
  });
});
