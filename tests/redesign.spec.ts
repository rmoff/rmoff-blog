import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotDir = path.resolve(__dirname, '..', 'static', 'prototypes', 'screenshots');

const pages = [
  { name: 'homepage', url: '/' },
  { name: 'article', url: '/2026/01/14/alternatives-to-minio-for-single-node-local-s3/' },
  { name: 'interesting-links', url: '/2026/01/20/interesting-links-january-2026/' },
  { name: 'categories', url: '/categories/' },
  { name: 'search', url: '/search/' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

for (const page of pages) {
  for (const viewport of viewports) {
    test(`redesign: ${page.name} at ${viewport.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const p = await context.newPage();

      const errors: string[] = [];
      p.on('pageerror', (err) => errors.push(err.message));

      const response = await p.goto(`http://localhost:1313${page.url}`, { waitUntil: 'networkidle' });
      expect(response?.status()).toBeLessThan(400);

      await p.waitForTimeout(1500); // fonts

      await p.screenshot({
        path: path.join(screenshotDir, `redesign-${page.name}-${viewport.name}.png`),
        fullPage: true,
      });

      // Allow some console errors from third-party scripts (giscus, posthog)
      // but flag actual page errors
      const criticalErrors = errors.filter(e =>
        !e.includes('posthog') &&
        !e.includes('giscus') &&
        !e.includes('pagefind')
      );
      expect(criticalErrors).toEqual([]);

      await context.close();
    });
  }
}
