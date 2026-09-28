import { test, expect } from '@playwright/test';

test('ping action runs in the Worker and reads a binding var', async ({ page }) => {
  await page.goto('/spike/');
  await page.getByRole('button', { name: 'Ping' }).click();
  await expect(page.locator('#out')).toHaveText('pong from https://simongreer.co.uk', { timeout: 10_000 });
});
