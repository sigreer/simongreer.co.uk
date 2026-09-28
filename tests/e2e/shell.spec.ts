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

async function openMobileMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  return page.locator('[data-mobile-menu]');
}

test('header shows nav items and marks the active one', async ({ page, isMobile }) => {
  await page.goto('/');
  const scope = isMobile ? await openMobileMenu(page) : page.locator('.desktop-nav');
  const nav = scope.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Blog Posts' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'About Me' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'About Me' })).not.toHaveAttribute('aria-current');
});

test('hire me dropdown lists the four nav services', async ({ page, isMobile }) => {
  test.skip(isMobile, 'dropdown is desktop only');
  await page.goto('/');
  await page.locator('.desktop-nav').getByText('Hire Me').click();
  const menu = page.getByRole('list', { name: 'Hire me services' });
  await expect(menu.getByRole('link')).toHaveCount(4);
  expect(await menu.getByRole('link').evaluateAll((els) => els.map((e) => e.getAttribute('href')))).toEqual([
    '/hire-me/web-development/',
    '/hire-me/business-apps/',
    '/hire-me/networking-and-security/',
    '/hire-me/storage-and-nas/',
  ]);
  await expect(menu.getByRole('link', { name: /Networking, Security, VPNs/ })).toHaveAttribute(
    'href',
    '/hire-me/networking-and-security/',
  );
});

test('mobile menu opens as a modal and contains the theme toggle', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const dialog = await openMobileMenu(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Blog Posts' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /switch to (dark|light) theme/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'true');
});

test('mobile menu traps focus, closes on Escape and restores focus', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const dialog = await openMobileMenu(page);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab');
    const inside = await page.evaluate(() => document.activeElement?.closest('[data-mobile-menu]') !== null);
    expect(inside, `tab ${i} left the dialog`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
});

test('mobile menu closes itself when the viewport grows past the breakpoint', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const dialog = await openMobileMenu(page);
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
});

test('theme toggle works from the mobile menu and persists', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const dialog = await openMobileMenu(page);
  await dialog.getByRole('button', { name: /switch to dark/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('escape closes the hire me dropdown and keeps focus on its summary', async ({ page, isMobile }) => {
  test.skip(isMobile, 'dropdown is desktop only');
  await page.goto('/');
  await page.locator('.desktop-nav').getByText('Hire Me').click();
  const menu = page.getByRole('list', { name: 'Hire me services' });
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('link').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.desktop-nav summary')).toBeFocused();
  await expect(menu.getByRole('link').first()).toBeHidden();
});
