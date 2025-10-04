import { test, expect } from '@playwright/test';

test.describe('Mobile Lead Form Layout', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE
  });

  test('should display lead form without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    
    // Wait for hero and form to load
    await page.waitForSelector('[data-qa="hero"]', { timeout: 10000 });
    await page.waitForSelector('[data-qa="lead-form"]', { timeout: 10000 });
    
    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px rounding
  });

  test('should not overlap chat launcher and submit button', async ({ page }) => {
    await page.goto('/');
    
    // Wait for elements
    await page.waitForSelector('[data-qa="chat-launcher"]', { timeout: 10000 });
    await page.waitForSelector('[data-qa="lead-form"]', { timeout: 10000 });
    
    // Scroll to form
    await page.locator('[data-qa="lead-form"]').scrollIntoViewIfNeeded();
    
    // Get bounding boxes
    const chatRect = await page.locator('[data-qa="chat-launcher"]').boundingBox();
    const submitButton = page.locator('[data-qa="lead-form"] button[type="submit"]').first();
    const submitRect = await submitButton.boundingBox();
    
    expect(chatRect).not.toBeNull();
    expect(submitRect).not.toBeNull();
    
    if (chatRect && submitRect) {
      // Check no overlap
      const noOverlap = 
        chatRect.x + chatRect.width < submitRect.x ||
        chatRect.x > submitRect.x + submitRect.width ||
        chatRect.y + chatRect.height < submitRect.y ||
        chatRect.y > submitRect.y + submitRect.height;
      
      expect(noOverlap).toBeTruthy();
    }
  });

  test('should keep input visible when keyboard opens', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-qa="lead-form"]', { timeout: 10000 });
    
    // Focus on first input
    const nameInput = page.locator('[data-qa="lead-form"] input[id="lead-name"]');
    await nameInput.scrollIntoViewIfNeeded();
    await nameInput.click();
    
    // Check input is still visible after focus
    const isVisible = await nameInput.isVisible();
    expect(isVisible).toBeTruthy();
    
    // Check input is in viewport
    const boundingBox = await nameInput.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    if (boundingBox) {
      const viewport = page.viewportSize();
      expect(boundingBox.y).toBeGreaterThanOrEqual(0);
      expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport!.height);
    }
  });

  // Tripwire test removed per user request

  test('should have proper tap targets (≥44px)', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-qa="lead-form"]', { timeout: 10000 });
    
    // Check submit button
    const submitButton = page.locator('[data-qa="lead-form"] button[type="submit"]').first();
    const submitBox = await submitButton.boundingBox();
    
    expect(submitBox).not.toBeNull();
    if (submitBox) {
      expect(submitBox.height).toBeGreaterThanOrEqual(44);
    }
    
    // Check text inputs
    const nameInput = page.locator('[data-qa="lead-form"] input[id="lead-name"]');
    const nameBox = await nameInput.boundingBox();
    
    expect(nameBox).not.toBeNull();
    if (nameBox) {
      expect(nameBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should be centered with proper safe gap', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-qa="lead-form"]', { timeout: 10000 });
    await page.waitForSelector('[data-qa="chat-launcher"]', { timeout: 10000 });
    
    // Get chat width
    const chatBox = await page.locator('[data-qa="chat-launcher"]').boundingBox();
    expect(chatBox).not.toBeNull();
    
    // Get form width
    const formBox = await page.locator('[data-qa="lead-form"]').boundingBox();
    expect(formBox).not.toBeNull();
    
    if (chatBox && formBox) {
      const safeGap = chatBox.width + 24;
      const viewport = page.viewportSize();
      const gutter = 16; // minimum gutter
      
      const expectedMaxWidth = viewport!.width - (gutter * 2) - safeGap;
      
      // Form should not exceed expected width
      expect(formBox.width).toBeLessThanOrEqual(expectedMaxWidth + 10); // Allow 10px tolerance
      
      console.log(`Form width: ${formBox.width}px, Expected max: ${expectedMaxWidth}px`);
    }
  });
});

test.describe('Tablet Lead Form Layout', () => {
  test.use({ 
    viewport: { width: 768, height: 1024 } // iPad
  });

  test('should display properly on tablet', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-qa="hero"]', { timeout: 10000 });
    await page.waitForSelector('[data-qa="lead-form"]', { timeout: 10000 });
    
    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    
    // Tripwire check removed per user request
  });
});

test.describe('Desktop Lead Form Layout', () => {
  test.use({ 
    viewport: { width: 1440, height: 900 } // Desktop
  });

  test('should not apply mobile styles on desktop', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('[data-qa="lead-form"]', { timeout: 10000 });
    
    // Check form doesn't have mobile width constraints
    const formBox = await page.locator('[data-qa="lead-form"]').boundingBox();
    expect(formBox).not.toBeNull();
    
    if (formBox) {
      // On desktop, form should not be restricted by chat safe gap
      // It should be narrower than viewport (centered layout)
      const viewport = page.viewportSize();
      expect(formBox.width).toBeLessThan(viewport!.width * 0.8); // Should be contained
    }
  });
});
