import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke suite against the static export (`out/` served locally).
 * No webcam in CI: the keyboard map drives UI actions, `window.__hgcSimulate`
 * drives the real machine path, and the camera slot uses Chromium's fake device.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: 'npx serve out -l 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
        },
        contextOptions: {
          permissions: ['camera'],
        },
      },
    },
  ],
});
