import { test, expect, Page } from '@playwright/test';

// Hamburger drawer (<=1024px). Paths are relative to baseURL in
// playwright.config.ts.
const toggle = (page: Page) => page.locator('.nav-toggle');
const drawer = (page: Page) => page.locator('#mobile-nav');

test.describe('Mobile nav drawer', () => {
  test.use({ viewport: { width: 960, height: 900 } });

  test('toggle reflects state and swaps to a close icon', async ({ page }) => {
    await page.goto('/');
    await expect(drawer(page)).toBeHidden();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Open menu');
    await expect(toggle(page).locator('.nav-toggle-open')).toBeVisible();
    await expect(toggle(page).locator('.nav-toggle-close')).toBeHidden();

    await toggle(page).click();
    await expect(drawer(page)).toBeVisible();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Close menu');
    await expect(toggle(page).locator('.nav-toggle-open')).toBeHidden();
    await expect(toggle(page).locator('.nav-toggle-close')).toBeVisible();

    await toggle(page).click();
    await expect(drawer(page)).toBeHidden();
  });

  test('Escape closes and returns focus to the toggle', async ({ page }) => {
    await page.goto('/');
    await toggle(page).click();
    await page.keyboard.press('Escape');
    await expect(drawer(page)).toBeHidden();
    await expect(toggle(page)).toBeFocused();
  });

  test('clicking outside closes it', async ({ page }) => {
    await page.goto('/');
    const url = page.url();
    await toggle(page).click();
    await page.mouse.click(20, 400); // page content left of the tablet panel
    await expect(drawer(page)).toBeHidden();
    expect(page.url()).toBe(url);
  });

  test('widening past the breakpoint closes it', async ({ page }) => {
    await page.goto('/');
    await toggle(page).click();
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(drawer(page)).toBeHidden();
    await page.setViewportSize({ width: 960, height: 900 });
    await expect(drawer(page)).toBeHidden();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('primary links and labelled social links, in the UI font', async ({ page }) => {
    await page.goto('/');
    await toggle(page).click();
    await expect(drawer(page).locator('.mobile-nav-primary a')).toHaveText(['Home', 'Interesting Links', 'Categories', 'Search']);
    await expect(drawer(page).locator('.mobile-nav-social a')).toHaveText(['RSS', 'LinkedIn', 'X', 'Bluesky', 'YouTube', 'Talks', 'GitHub']);
    // At tablet widths these used to fall back to the serif, link-blue article style.
    for (const link of await drawer(page).locator('a').all()) {
      const { font, color } = await link.evaluate(el => ({ font: getComputedStyle(el).fontFamily, color: getComputedStyle(el).color }));
      expect(font).toContain('Outfit');
      expect(color).not.toBe('rgb(55, 48, 163)'); // --color-link
      await expect(link.locator('svg')).toHaveCount(1);
    }
  });

  test('marks the current page', async ({ page }) => {
    await page.goto('/categories/');
    await toggle(page).click();
    await expect(drawer(page).locator('[aria-current="page"]')).toHaveText('Categories');
    await page.goto('/');
    await toggle(page).click();
    await expect(drawer(page).locator('[aria-current="page"]')).toHaveText('Home');
  });

  test('is a panel on tablets and full width on phones', async ({ page }) => {
    await page.goto('/');
    await toggle(page).click();
    let box = (await drawer(page).boundingBox())!;
    expect(box.width).toBeLessThan(400);
    expect(Math.round(box.x + box.width)).toBe(960); // anchored right, under the toggle

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await toggle(page).click();
    box = (await drawer(page).boundingBox())!;
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(390);
  });
});

test('desktop social icons keep their links and gain readable labels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const links = page.locator('.site-nav .nav-social a');
  await expect(links).toHaveCount(6);
  await expect(links.first()).toHaveAttribute('aria-label', 'LinkedIn');
  await expect(links.first()).toHaveAttribute('href', 'https://www.linkedin.com/in/robinmoffatt/');
});
