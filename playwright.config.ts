import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.E2E_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:4173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, // throttle on CI, use all cores locally
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    bypassCSP: true, // allow inline helpers to execute under the app's CSP during CI runs
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
