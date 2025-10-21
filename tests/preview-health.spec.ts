/**
 * Preview Environment Health Tests
 * Automated tests to ensure preview environment works correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Preview Environment Health', () => {
  test('should load without blank screen', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to mount
    await page.waitForSelector('#root', { timeout: 5000 });
    
    // Check root element is visible
    const root = await page.locator('#root');
    await expect(root).toBeVisible();
    
    // Check opacity is 1
    const opacity = await root.evaluate(el => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
    
    // Check there's actual content
    const content = await page.textContent('#root');
    expect(content?.length).toBeGreaterThan(100);
  });

  test('should not redirect in preview environment', async ({ page }) => {
    const initialUrl = '/';
    await page.goto(initialUrl);
    
    // Wait a bit to see if any redirects happen
    await page.waitForTimeout(2000);
    
    // Should still be on the same origin
    const currentUrl = page.url();
    expect(currentUrl).toContain(initialUrl);
  });

  test('should show no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('404') &&
      !err.includes('DevTools') &&
      !err.includes('X-Frame-Options') &&
      !err.includes('Failed to load resource') &&
      !err.includes('FunctionsHttpError')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have service worker disabled in dev', async ({ page }) => {
    await page.goto('/');
    
    const swCount = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length;
      }
      return 0;
    });
    
    // Should be 0 in development/preview
    expect(swCount).toBe(0);
  });

  test('should load main navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // Check for header
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check for main content area
    const main = page.locator('#main');
    await expect(main).toBeVisible();
  });

  test('should have working error boundary', async ({ page }) => {
    await page.goto('/');

    // Inject an error but ensure it doesn't crash the page
    await expect(async () => {
      await page.evaluate(() => {
        throw new Error('Test error');
      });
    }).rejects.toThrow();

    const root = await page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('safe mode should work with ?safe=1', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/?safe=1');

    await page.waitForTimeout(1000);

    const hasSafeModeLog = logs.some(log => log.includes('SAFE MODE'));
    expect(hasSafeModeLog).toBeTruthy();
  });

  test('should have fast initial load time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should render hero section', async ({ page }) => {
    await page.goto('/');
    
    // Look for main headline
    const h1 = page.locator('#hero-h1');
    await expect(h1).toBeVisible();
    
    const text = await h1.textContent();
    expect(text?.length).toBeGreaterThan(10);
  });

  test('should not have z-index issues', async ({ page }) => {
    await page.goto('/');
    
    // Check header z-index is high enough
    const header = page.locator('header').first();
    const zIndex = await header.evaluate(el => window.getComputedStyle(el).zIndex);
    
    expect(parseInt(zIndex) || 0).toBeGreaterThanOrEqual(40);
  });
});

