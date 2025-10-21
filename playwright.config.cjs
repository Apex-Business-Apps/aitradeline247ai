// playwright.config.cjs — CommonJS so GitHub Actions Babel doesn’t choke on `import`
const { defineConfig, devices } = require('@playwright/test');

const localPreviewUrl = 'http://127.0.0.1:4173';
const resolvedBaseURL = process.env.BASE_URL || localPreviewUrl;

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: resolvedBaseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    bypassCSP: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: localPreviewUrl,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
