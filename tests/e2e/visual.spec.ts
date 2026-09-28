import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`shell snapshot (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`home-${theme}.png`, { fullPage: true });
  });
}
