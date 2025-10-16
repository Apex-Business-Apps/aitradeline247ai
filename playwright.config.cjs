*** /dev/null
--- a/playwright.config.cjs
@@
+// CommonJS Playwright config so CI doesn't choke on `import`.
+const { defineConfig, devices } = require('@playwright/test');
+
+module.exports = defineConfig({
+  timeout: 120000,
+  testDir: 'tests',
+  use: {
+    baseURL: process.env.BASE_URL || 'http://localhost:5173',
+    headless: true,
+    trace: 'retain-on-failure'
+  },
+  projects: [
+    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
+  ],
+});
