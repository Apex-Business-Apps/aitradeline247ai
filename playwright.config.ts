import { defineConfig, devices } from '@playwright/test';

const localPreviewUrl = 'http://127.0.0.1:4173';
const resolvedBaseURL =
  process.env.BASE_URL ||
  process.env.E2E_BASE_URL ||
  localPreviewUrl;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: resolvedBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    bypassCSP: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: localPreviewUrl,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
