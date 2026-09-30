import { test, expect } from '@playwright/test';

// Regression: the "On this page" sidebar and mobile "Table of Contents" used to
// render for any post over 300 words, even when the post had no headings,
// leaving an empty TOC box.
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:1313';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

// >300 words, no section headings
const NO_HEADINGS = [
  { name: 'adoc', url: '/2019/08/15/reset-kafka-connect-source-connector-offsets/' },
  { name: 'md', url: '/2023/11/16/hugo-not-detecting-changed-pages-on-mac/' },
];

// Posts with section headings
const WITH_HEADINGS = [
  { name: 'adoc', url: '/2026/01/14/alternatives-to-minio-for-single-node-local-s3/' },
  { name: 'md', url: '/2024/01/03/1%EF%B8%8F%E2%83%A3%EF%B8%8F-1brc-in-sql-with-duckdb/' },
];

// Interesting Links post (>= 2026-03-01) with the popular-links sidebar aside
const IL_POST = '/2026/08/20/interesting-links-august-2026/';

// feature-nohdr post (uses .article-header rather than the hero) with no headings
const NOHDR_NO_HEADINGS = '/2016/06/15/using-jupyter-notebooks-big-data-discovery-1-2/';

test.describe('Empty TOC is not rendered', () => {
  for (const { name, url } of NO_HEADINGS) {
    test(`${name} post without headings: no desktop sidebar TOC`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: DESKTOP });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'load' });

      await expect(page.locator('.docs-toc')).toHaveCount(0);
      await expect(page.locator('#back_to_top')).toHaveCount(0);
      // Content column takes the single-column layout used when there's no sidebar
      const cols = await page
        .locator('.container-fluid.docs > .row')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length);
      expect(cols).toBe(1);

      await context.close();
    });

    test(`${name} post without headings: no mobile TOC`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: MOBILE });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'load' });

      await expect(page.locator('.toc-mobile')).toHaveCount(0);

      await context.close();
    });
  }

  test('feature-nohdr post without headings: header uses no-toc width', async ({ page }) => {
    await page.goto(`${BASE_URL}${NOHDR_NO_HEADINGS}`, { waitUntil: 'load' });
    await expect(page.locator('.article-header')).toHaveClass(/article-header--no-toc/);
    await expect(page.locator('.docs-toc')).toHaveCount(0);
  });
});

test.describe('Non-empty TOC is still rendered', () => {
  for (const { name, url } of WITH_HEADINGS) {
    test(`${name} post with headings: desktop sidebar TOC has links`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: DESKTOP });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'load' });

      const toc = page.locator('.docs-toc');
      await expect(toc).toBeVisible();
      await expect(toc.locator('#back_to_top')).toHaveCount(1);
      expect(await toc.locator('li a[href^="#"]:not(#back_to_top)').count()).toBeGreaterThan(0);

      await context.close();
    });

    test(`${name} post with headings: mobile TOC has links`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: MOBILE });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'load' });

      const mobileToc = page.locator('.toc-mobile');
      await expect(mobileToc).toBeVisible();
      expect(await mobileToc.locator('li a[href^="#"]').count()).toBeGreaterThan(0);

      await context.close();
    });
  }

  test('Interesting Links post keeps TOC and popular-links aside', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${IL_POST}`, { waitUntil: 'load' });

    const toc = page.locator('.docs-toc');
    await expect(toc).toBeVisible();
    expect(await toc.locator('li a[href^="#"]:not(#back_to_top)').count()).toBeGreaterThan(0);
    await expect(toc.locator('aside.popular-links.popular-links--sidebar')).toHaveCount(1);

    await context.close();
  });
});
