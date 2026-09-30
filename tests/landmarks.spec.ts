import { test, expect } from '@playwright/test';

// Every page must expose exactly one `main` landmark. baseof.html provides it;
// layouts/partials must not open a second (nested) <main> or role="main".
// Paths are relative so they resolve against the config's baseURL.
const PAGES: Record<string, string> = {
  'article (.md)': '/2016/05/24/york-fry-ups/',
  'article (.adoc)': '/2024/10/15/why-do-i-need-cdc/',
  'talk': '/talk/blog-writing-for-developers/',
  'interesting links': '/2026/08/20/interesting-links-august-2026/',
  'home': '/',
  'category': '/categories/kafka-connect/',
  '404': '/this-page-does-not-exist/',
};

test.describe('Landmarks: single main', () => {
  for (const [name, path] of Object.entries(PAGES)) {
    test(`${name} has exactly one main landmark`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const count = await page.evaluate(
        () => document.querySelectorAll('main, [role="main"]').length,
      );
      expect(count).toBe(1);
    });
  }

  test('article content wrapper sits inside the single main', async ({ page }) => {
    await page.goto(PAGES['article (.adoc)'], { waitUntil: 'domcontentloaded' });
    const inMain = await page.evaluate(
      () => !!document.querySelector('main .docs-content .article'),
    );
    expect(inMain).toBe(true);
  });
});
