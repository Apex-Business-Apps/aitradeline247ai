// playwright.config.cjs — CommonJS so GitHub Actions Babel doesn’t choke on `import`
const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:5000';

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    bypassCSP: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
