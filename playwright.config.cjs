// playwright.config.cjs — CommonJS so GitHub Actions Babel doesn’t choke on `import`
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    bypassCSP: true, // bypass CSP so inline fixtures used in tests stop breaking Codemagic builds
    bypassCSP: true, // allow inline script/style overrides during tests
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
