import { test, expect, Page } from '@playwright/test';

// Uses relative URLs so the config's baseURL (default http://localhost:1313) applies.
const ARTICLE_URL = '/2026/01/14/alternatives-to-minio-for-single-node-local-s3/';
const IL_URL = '/2026/01/20/interesting-links-january-2026/';
const MISSING_URL = '/nonexistent-page-test';

async function style(page: Page, selector: string, prop: string): Promise<string> {
  return page.locator(selector).first().evaluate(
    (el, p) => getComputedStyle(el).getPropertyValue(p),
    prop,
  );
}

// Expected transition-duration per element: [reduce, no-preference]
const TRANSITIONS: Array<[string, string, string, string]> = [
  // [page, selector, reduce, no-preference]
  [ARTICLE_URL, 'body', '0s', '0.1s'],
  [ARTICLE_URL, '.headline-hash', '0s', '0.15s'],
  [IL_URL, '.il-toggle-knob', '0s', '0.2s'],
  // Colour-only hover transitions are intentionally kept in both modes
  [ARTICLE_URL, 'article.article a', '0.15s', '0.15s'],
];

for (const mode of ['reduce', 'no-preference'] as const) {
  const reduce = mode === 'reduce';

  test.describe(`prefers-reduced-motion: ${mode}`, () => {
    test.use({ contextOptions: { reducedMotion: mode }, viewport: { width: 1440, height: 900 } });

    test('transition durations', async ({ page }) => {
      for (const [url, selector, whenReduce, whenNoPref] of TRANSITIONS) {
        await page.goto(url);
        expect(await style(page, selector, 'transition-duration'), selector)
          .toBe(reduce ? whenReduce : whenNoPref);
      }
    });

    test('page scrolling is never smooth', async ({ page }) => {
      await page.goto(ARTICLE_URL);
      expect(await style(page, 'html', 'scroll-behavior')).toBe('auto');
    });

    test('404 cursor blinks only without reduced motion', async ({ page }) => {
      await page.goto(MISSING_URL);
      expect(await style(page, '.terminal-cursor-inline', 'animation-name'))
        .toBe(reduce ? 'none' : 'blink');
    });

    test('lightbox opens and closes', async ({ page }) => {
      await page.goto(ARTICLE_URL, { waitUntil: 'load' });
      // :visible skips the display:none Pagefind meta image
      const zoomable = page.locator('img.lightbox-zoom:visible').first();
      await expect(zoomable).toBeVisible();
      await zoomable.click();

      const overlay = page.locator('.lightbox-overlay');
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveCSS('opacity', '1');
      expect(await style(page, '.lightbox-overlay', 'transition-duration'))
        .toBe(reduce ? '0s' : '0.2s');

      // Close and check synchronously whether the overlay is gone straight away
      const goneImmediately = await page.evaluate(() => {
        (document.querySelector('.lightbox-overlay') as HTMLElement).click();
        return document.querySelector('.lightbox-overlay') === null;
      });
      expect(goneImmediately).toBe(reduce);
      await expect(overlay).toHaveCount(0);

      // Escape also closes it
      await zoomable.click();
      await expect(overlay).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(overlay).toHaveCount(0);
    });

    test('TOC link jumps to its heading', async ({ page }) => {
      await page.goto(ARTICLE_URL);
      const link = page.locator('.docs-toc a').nth(2);
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^#/);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator(href!)).toBeInViewport();
    });

    test('IL fire toggle still filters and moves the knob', async ({ page }) => {
      await page.goto(IL_URL);
      await page.locator('#il-fire-toggle').click();
      await expect(page.locator('#il-fire-cb')).toBeChecked();
      await expect(page.locator('.il-toggle-knob')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 16, 0)');
      expect(await page.locator('li.il-hidden').count()).toBeGreaterThan(0);
    });

    test('home year group expands and collapses', async ({ page }) => {
      await page.goto('/');
      const group = page.locator('details.year-group:not([open])').first();
      const year = await group.getAttribute('data-year');
      const target = page.locator(`details.year-group[data-year="${year}"]`);
      await target.locator('summary').click();
      await expect(target).toHaveAttribute('open', '');
      await target.locator('summary').click();
      await expect(target).not.toHaveAttribute('open', '');
    });
  });

  test.describe(`prefers-reduced-motion: ${mode} (mobile)`, () => {
    test.use({ contextOptions: { reducedMotion: mode }, viewport: { width: 390, height: 844 } });

    test('mobile nav toggle opens the menu', async ({ page }) => {
      await page.goto('/');
      await page.locator('.nav-toggle').click();
      await expect(page.locator('.mobile-nav')).toBeVisible();
    });
  });
}
