import { defineConfig, devices } from '@playwright/test';

const raw = process.env.E2E_PORT;
const port = raw === undefined || raw === '' ? 8787 : Number(raw);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error('E2E_PORT must be a positive integer');
}
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  use: { baseURL: origin, trace: 'retain-on-failure' },
  webServer: {
    command: 'bun run preview',
    env: { ...process.env, E2E_PORT: String(port) } as Record<string, string>,
    url: `${origin}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
});
