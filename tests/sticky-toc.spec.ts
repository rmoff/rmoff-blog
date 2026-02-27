import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:1314';
const ARTICLE_URL = '/2026/01/14/alternatives-to-minio-for-single-node-local-s3/';

test.describe('Sticky ToC', () => {
  test('desktop: ToC stays visible when scrolling down', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${ARTICLE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const toc = page.locator('.docs-toc');
    await expect(toc).toBeVisible();

    // Get initial position
    const initialBox = await toc.boundingBox();
    expect(initialBox).toBeTruthy();

    // Scroll down significantly
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(500);

    // ToC should still be within viewport (sticky)
    const afterScrollBox = await toc.boundingBox();
    expect(afterScrollBox).toBeTruthy();
    if (afterScrollBox) {
      // The ToC top should stay near the top of the viewport (around 92px for header)
      // rather than scrolling off-screen
      expect(afterScrollBox.y).toBeLessThan(200);
      expect(afterScrollBox.y).toBeGreaterThanOrEqual(0);
    }

    await context.close();
  });

  test('desktop: ToC active link updates on scroll', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${ARTICLE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check that at least one ToC link has the active class initially or after scroll
    const tocLinks = page.locator('.docs-toc a');
    const count = await tocLinks.count();
    expect(count).toBeGreaterThan(0);

    // Scroll to a heading further down the page
    await page.evaluate(() => {
      const headings = document.querySelectorAll('h2, h3');
      if (headings.length > 2) {
        headings[2].scrollIntoView({ behavior: 'instant' });
      }
    });
    await page.waitForTimeout(500);

    // An active class should exist on one of the ToC links
    const activeLinks = page.locator('.docs-toc a.active');
    expect(await activeLinks.count()).toBeGreaterThanOrEqual(1);

    await context.close();
  });

  test('desktop: no horizontal overflow on article with code blocks', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${ARTICLE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth);

    await context.close();
  });

  test('tablet (768x1024): desktop ToC hidden, mobile ToC visible', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${ARTICLE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const desktopToc = page.locator('.docs-toc');
    if (await desktopToc.count() > 0) {
      await expect(desktopToc).toBeHidden();
    }

    const mobileToc = page.locator('.toc-mobile');
    if (await mobileToc.count() > 0) {
      await expect(mobileToc).toBeVisible();
    }

    await context.close();
  });

  test('mobile (375x812): no horizontal overflow', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}${ARTICLE_URL}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 1);

    // Desktop ToC hidden
    const desktopToc = page.locator('.docs-toc');
    if (await desktopToc.count() > 0) {
      await expect(desktopToc).toBeHidden();
    }

    // Mobile ToC visible
    const mobileToc = page.locator('.toc-mobile');
    if (await mobileToc.count() > 0) {
      await expect(mobileToc).toBeVisible();
    }

    await context.close();
  });
});
