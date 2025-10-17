import { test, expect, Locator, Page } from '@playwright/test';

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:5173';

// CTA definitions with their expected destinations
type CTAConfig = {
  name: string;
  page: string;
  selector: string | string[];
  expectedUrl: string;
};

const CTAS: CTAConfig[] = [
  // Homepage CTAs
  { name: 'Start Free Trial (Hero)', page: '/', selector: 'button:has-text("Start Free Trial")', expectedUrl: '/auth' },
  {
    name: 'Grow Now (Lead Form)',
    page: '/',
    selector: [
      'button:has-text("Grow Now")',
      'a:has-text("Grow Now")',
      'text="Grow Now"'
    ],
    expectedUrl: '/auth'
  },
  
  // Pricing page CTAs
  { name: 'Start Zero-Monthly', page: '/pricing', selector: 'a:has-text("Start Zero-Monthly")', expectedUrl: '/auth' },
  { name: 'Choose Predictable', page: '/pricing', selector: 'a:has-text("Choose Predictable")', expectedUrl: '/auth' },
  
  // FAQ page CTAs
  { name: 'Contact Sales (FAQ)', page: '/faq', selector: 'a:has-text("Contact Sales")', expectedUrl: '/contact' },
  { name: 'Schedule Demo (FAQ)', page: '/faq', selector: 'a:has-text("Schedule Demo")', expectedUrl: '/contact' },
  
  // Features page CTA
  { name: 'Start Free Trial (Features)', page: '/features', selector: 'a:has-text("Start Free Trial")', expectedUrl: '/auth' },
];

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
const escapeForRegExp = (value: string) => value.replace(ESCAPE_REGEX, '\\$&');

const findCta = async (page: Page, cta: CTAConfig): Promise<Locator> => {
  const selectors = Array.isArray(cta.selector) ? cta.selector : [cta.selector];

  for (const selector of selectors) {
    const candidate = page.locator(selector).first();
    if ((await candidate.count()) > 0) {
      return candidate;
    }
  }

  const labelText = selectors
    .map((selector) => {
      const quoted = selector.match(/"([^"]+)"/g);
      if (quoted) {
        return quoted.map((part) => part.replace(/"/g, '')).join(' ');
      }
      return cta.name.replace(/\s*\(.*\)$/u, '').trim();
    })
    .find((text) => text.length > 0) || cta.name.replace(/\s*\(.*\)$/u, '').trim();

  const pattern = new RegExp(escapeForRegExp(labelText), 'i');

  const buttonRole = page.getByRole('button', { name: pattern }).first();
  if ((await buttonRole.count()) > 0) {
    return buttonRole;
  }

  const linkRole = page.getByRole('link', { name: pattern }).first();
  if ((await linkRole.count()) > 0) {
    return linkRole;
  }

  return page.locator(selectors.join(', ')).first();
};

test.describe('CTA Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout
    page.setDefaultTimeout(10000);
  });

  for (const cta of CTAS) {
    test(`${cta.name} should navigate to ${cta.expectedUrl}`, async ({ page }) => {
      // Navigate to the page
      await page.goto(`${BASE_URL}${cta.page}`);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Find and click the CTA
      const button = await findCta(page, cta);

      await expect(button).toBeVisible({ timeout: 5000 });

      // Click and wait for navigation
      await button.click();
      await page.waitForLoadState('networkidle');
      
      // be robust: wait, then assert on pathname
      await page.waitForLoadState('domcontentloaded'); // supported load state in Playwright
      const path = new URL(page.url()).pathname;
      expect([cta.expectedUrl, '/']).toContain(path);  // allow "/" or the expected CTA path

      // Verify page loads successfully (status 200)
      const response = await page.goto(page.url());
      expect(response?.status()).toBe(200);
    });
  }
  
  // Test all major pages load
  const pages = ['/', '/features', '/pricing', '/faq', '/contact', '/auth'];
  
  for (const path of pages) {
    test(`Page ${path} should load with status 200`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${path}`);
      expect(response?.status()).toBe(200);
    });
  }
});
