import { test, expect } from '@playwright/test';

test.describe('Header UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1313/');
  });

  test('site title is visible and links to homepage', async ({ page }) => {
    const title = page.locator('.site-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('rmoff\'s random ramblings');
    await expect(title).toHaveAttribute('href', /\/$/);
  });

  test('nav links are present', async ({ page }) => {
    const nav = page.locator('.site-nav');
    await expect(nav.locator('a', { hasText: 'Categories' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Search' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'RSS' })).toBeVisible();
  });

  test('social icons are present in nav', async ({ page }) => {
    const socialNav = page.locator('.nav-social');
    const socialLinks = socialNav.locator('a');

    // Should have at least a few social links (linkedin, x-twitter, bluesky, youtube, github, talks)
    const count = await socialLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Each social link should have an SVG icon
    for (let i = 0; i < count; i++) {
      await expect(socialLinks.nth(i).locator('svg')).toBeVisible();
    }
  });

  test('talks link is present in social icons', async ({ page }) => {
    const talksLink = page.locator('.nav-social a[title="talks"]');
    await expect(talksLink).toBeVisible();
  });

  test('header is width-constrained and centered on wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('http://localhost:1313/');

    const headerInner = page.locator('.site-header-inner');
    const box = await headerInner.boundingBox();
    expect(box).not.toBeNull();

    // Max-width is 1200px, so content should be narrower than viewport
    expect(box!.width).toBeLessThanOrEqual(1250);

    // Should be roughly centered
    const leftMargin = box!.x;
    const rightMargin = 1400 - (box!.x + box!.width);
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(50);
  });

  test('mobile nav toggle is hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto('http://localhost:1313/');

    const toggle = page.locator('.nav-toggle');
    await expect(toggle).toBeHidden();
  });
});
