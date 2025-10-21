/**
 * H310-5: E2E Test to detect React Error #310
 * 
 * Catches "Rendered more hooks than during the previous render" errors
 * across critical routes before they reach production.
 */

import { test, expect } from '@playwright/test';

const CRITICAL_ROUTES = [
  '/',
  '/features',
  '/pricing',
  '/faq',
  '/contact',
  '/dashboard',
];

test.describe('React Error #310 Detection', () => {
  for (const route of CRITICAL_ROUTES) {
    test(`should not throw hook errors on ${route}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      
      // Capture console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Capture page errors
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });
      
      // Navigate to route
      await page.goto(route, { waitUntil: 'networkidle' });
      
      // Wait for potential errors to surface
      await page.waitForTimeout(2000);
      
      // Check for React Error #310 in console
      const hasHookError = consoleErrors.some(
        (err) =>
          err.includes('Rendered more hooks') ||
          err.includes('rendered more hooks') ||
          err.includes('hook') && err.includes('order')
      );
      
      // Check for React Error #310 in page errors
      const hasPageHookError = pageErrors.some(
        (err) =>
          err.includes('Rendered more hooks') ||
          err.includes('rendered more hooks') ||
          err.includes('Minified React error #310')
      );
      
      // Fail if hook error detected
      if (hasHookError || hasPageHookError) {
        console.error('🚨 Hook order violation detected on route:', route);
        console.error('Console errors:', consoleErrors);
        console.error('Page errors:', pageErrors);
      }
      
      expect(hasHookError, `Hook error in console on ${route}`).toBe(false);
      expect(hasPageHookError, `Hook error in page on ${route}`).toBe(false);
    });
  }
  
  test('should render app root on homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for React to mount
    await page.waitForTimeout(3000);
    
    // Check if root has content (React mounted successfully)
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.length).toBeGreaterThan(100);
    
    // Check for boot timeout flag (should not be set)
    const bootTimeout = await page.evaluate(() => (window as any).__BOOT_TIMEOUT__);
    expect(bootTimeout).toBeUndefined();
  });
});

