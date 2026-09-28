import { expect, test } from '@playwright/test';

test('theme toggle switches and persists (desktop pre-header)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pre-header is hidden on mobile');
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme', /.+/);
  await page.getByRole('button', { name: /switch to dark/i }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /switch to light/i }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
});

// The mobile variant lives in Task 9 because it needs the mobile menu.
