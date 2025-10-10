import { test, expect } from '@playwright/test';

test.describe('Header Position', () => {
  const widths = [360, 768, 1024];

  for (const width of widths) {
    test(`header left elements should be positioned near left edge at ${width}px width`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/app/dashboard');
      
      const headerLeft = page.locator('#app-header-left');
      await expect(headerLeft).toBeVisible();
      
      const boundingBox = await headerLeft.boundingBox();
      expect(boundingBox).not.toBeNull();
      
      if (boundingBox) {
        expect(boundingBox.x).toBeLessThanOrEqual(16);
      }
    });
  }
});
