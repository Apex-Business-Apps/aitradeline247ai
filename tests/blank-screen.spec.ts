import { test, expect } from '@playwright/test';

test.describe('Blank Screen Prevention', () => {
  test('preview loads without blank screen', async ({ page }) => {
    await page.goto('/');
    
    // Should render content within 3 seconds
    await expect(page.locator('#root')).toBeVisible({ timeout: 3000 });
    
    // Root should have content
    const rootContent = await page.locator('#root').textContent();
    expect(rootContent).toBeTruthy();
    expect(rootContent.length).toBeGreaterThan(100);
    
    // Main element should exist
    await expect(page.locator('#main')).toBeVisible();
    
    // Hero section should be visible
    await expect(page.locator('h1')).toContainText('24/7');
  });

  test('background image loads correctly', async ({ page }) => {
    await page.goto('/');
    
    const bgImage = page.locator('[style*="backgroundImage"]').first();
    await expect(bgImage).toBeVisible({ timeout: 5000 });
    
    // Check if image is actually loaded (not broken)
    const hasBackground = await bgImage.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage !== 'none';
    });
    
    expect(hasBackground).toBe(true);
  });

  test('startup splash does not block content', async ({ page }) => {
    await page.goto('/?nosplash=1'); // Disable splash for this test
    
    // Content should be immediately visible
    await expect(page.locator('#main')).toBeVisible({ timeout: 2000 });
  });

  test('safe mode unblanks screen', async ({ page }) => {
    await page.goto('/?safe=1');
    
    // Safe mode should force visibility
    await expect(page.locator('#root')).toBeVisible({ timeout: 2000 });
    
    // Check console for safe mode activation
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.waitForTimeout(1000);
    
    const hasSafeMode = logs.some(log => log.includes('SAFE MODE ACTIVE'));
    expect(hasSafeMode).toBe(true);
  });

  test('css renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // No CSS-related errors
    const cssErrors = errors.filter(e => 
      e.includes('CSS') || 
      e.includes('stylesheet') || 
      e.includes('style')
    );
    
    expect(cssErrors).toHaveLength(0);
  });

  test('root element has correct height', async ({ page }) => {
    await page.goto('/');
    
    const rootHeight = await page.locator('#root').evaluate((el) => {
      return el.getBoundingClientRect().height;
    });
    
    // Should be at least viewport height
    const viewportHeight = await page.viewportSize().then(vp => vp?.height || 0);
    expect(rootHeight).toBeGreaterThanOrEqual(viewportHeight * 0.9);
  });

  test('all major sections render', async ({ page }) => {
    await page.goto('/');
    
    // Check for key sections
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Hero content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Navigation
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

test.describe('Edge Function Health', () => {
  test('healthz endpoint responds quickly', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/functions/v1/healthz');
    const duration = Date.now() - start;
    
    expect(response.ok()).toBe(true);
    expect(duration).toBeLessThan(2000); // Should respond within 2s
    
    const data = await response.json();
    expect(data).toHaveProperty('healthy');
  });

  test('prewarm job succeeds', async ({ request }) => {
    const response = await request.post('/functions/v1/prewarm-cron');
    
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('endpoints_warmed');
    expect(data.endpoints_warmed).toBeGreaterThan(0);
  });
});

test.describe('PIPEDA Compliance', () => {
  test('privacy policy includes call recording section', async ({ page }) => {
    await page.goto('/privacy');
    
    // Check for call recording section
    await expect(page.locator('#call-recording')).toBeVisible();
    
    // Verify required elements
    const content = await page.locator('#call-recording').textContent();
    expect(content).toContain('Purpose');
    expect(content).toContain('Opt-Out');
    expect(content).toContain('Retention');
    expect(content).toContain('30 days');
  });

  test('privacy link in footer works', async ({ page }) => {
    await page.goto('/');
    
    const privacyLink = page.getByRole('link', { name: /privacy/i });
    await expect(privacyLink).toBeVisible();
    
    await privacyLink.click();
    await expect(page).toHaveURL('/privacy');
  });

  test('call recording anchor link works', async ({ page }) => {
    await page.goto('/privacy#call-recording');
    
    // Should scroll to section
    await page.waitForTimeout(500);
    
    const section = page.locator('#call-recording');
    await expect(section).toBeInViewport();
  });
});

