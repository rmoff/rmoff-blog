import { test, expect, Page } from '@playwright/test';

// Dark theme follows the OS (prefers-color-scheme). Paths are relative to
// baseURL in playwright.config.ts.
const MD_POST = '/2022/09/16/data-engineering-in-2022-exploring-lakefs-with-jupyter-and-pyspark/';
const ADOC_POST = '/2025/07/14/keeping-your-data-lakehouse-in-order-table-maintenance-in-apache-iceberg/';

const LIGHT_BG = 'rgb(250, 248, 245)'; // #FAF8F5
const DARK_BG = 'rgb(28, 25, 23)';     // #1C1917
const DARK_TEXT = 'rgb(237, 231, 224)'; // #EDE7E0

const bodyStyle = (page: Page) =>
  page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    return { bg: cs.backgroundColor, color: cs.color };
  });

test.describe('Dark mode', () => {
  test('page declares support for both colour schemes', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light dark');
  });

  test.describe('light OS preference', () => {
    test.use({ colorScheme: 'light' });

    test('keeps the cream palette', async ({ page }) => {
      await page.goto('/');
      const s = await bodyStyle(page);
      expect(s.bg).toBe(LIGHT_BG);
      expect(s.color).toBe('rgb(45, 41, 38)'); // #2D2926
    });

    test('markdown code keeps the pygments palette', async ({ page }) => {
      await page.goto(MD_POST);
      const kw = page.locator('pre.chroma .kn').first();
      await expect(kw).toHaveCSS('color', 'rgb(0, 128, 0)'); // #008000
    });
  });

  test.describe('dark OS preference', () => {
    test.use({ colorScheme: 'dark' });

    test('uses the warm dark palette', async ({ page }) => {
      await page.goto('/');
      const s = await bodyStyle(page);
      expect(s.bg).toBe(DARK_BG);
      expect(s.color).toBe(DARK_TEXT);
    });

    test('critical CSS paints dark before the stylesheet loads (no light flash)', async ({ page }) => {
      await page.route(/\.css(\?|$)/, route => route.abort());
      await page.goto('/');
      const htmlBg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
      expect(htmlBg).toBe(DARK_BG);
      const headerBg = await page.evaluate(() => getComputedStyle(document.querySelector('.site-header')!).backgroundColor);
      expect(headerBg).toBe(DARK_BG);
    });

    test('markdown code switches to the dark syntax palette', async ({ page }) => {
      await page.goto(MD_POST);
      const pre = page.locator('pre.chroma').first();
      await expect(pre).toHaveCSS('background-color', 'rgb(38, 34, 32)'); // --color-code-bg
      await expect(pre.locator('.kn').first()).toHaveCSS('color', 'rgb(143, 199, 122)'); // --hl-keyword
    });

    test('admonitions and headings use dark variants', async ({ page }) => {
      await page.goto(ADOC_POST);
      const adm = page.locator('.admonitionblock > table').first();
      const bg = await adm.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(bg).not.toMatch(/rgb\(2[0-9]{2}, 2[0-9]{2}, 2[0-9]{2}\)/); // not a light tint
      const rule = await page.locator('.docs-content .article h2').first()
        .evaluate(el => getComputedStyle(el).borderBottomColor);
      expect(rule).not.toBe('rgb(0, 0, 0)');
    });

    test('giscus comments follow the OS theme', async ({ page }) => {
      await page.goto(MD_POST);
      await expect(page.locator('script[src="https://giscus.app/client.js"]'))
        .toHaveAttribute('data-theme', 'preferred_color_scheme');
    });

    test('print output stays on the light palette', async ({ page }) => {
      await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
      await page.goto('/');
      const bg = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim());
      expect(bg).toBe('#FAF8F5');
    });

    test('404 terminal page is unchanged', async ({ page }) => {
      await page.goto('/nonexistent-page-test');
      const s = await bodyStyle(page);
      expect(s.bg).toBe('rgb(10, 10, 10)');
    });
  });
});
