import { defineConfig, devices } from '@playwright/test';

const previewPort = Number.parseInt(process.env.PREVIEW_PORT ?? '', 10) || 5173;
const resolvedBaseUrl =
  process.env.E2E_BASE_URL ??
  process.env.BASE_URL ??
  `http://127.0.0.1:${previewPort}`;
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: resolvedBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: 'npm run preview',
          url: resolvedBaseUrl,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
});
