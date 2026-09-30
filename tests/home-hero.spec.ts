import { test, expect } from '@playwright/test';

// The decorative home-page banner (.homepage-hero) is hidden at <=640px so the
// latest post's headline sits near the top on phones. The banner image's LCP
// preload in baseof.html is media-qualified to match, so phones don't download
// an image they never display.
const HERO_IMG = '/img/default-header-img.webp';

test.describe('Home page hero banner', () => {
  test('phone (390px): banner hidden, headline above the fold, banner image not fetched', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const heroRequests: string[] = [];
    page.on('request', (r) => { if (r.url().includes(HERO_IMG)) heroRequests.push(r.url()); });

    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.locator('.homepage-hero')).toBeHidden();

    const title = page.locator('.featured-post-title');
    await expect(title).toBeVisible();
    const box = await title.boundingBox();
    expect(box, 'featured post title has no bounding box').not.toBeNull();
    // Headline should be well within the first screen, not pushed below a banner.
    expect(box!.y + box!.height).toBeLessThan(844 / 2);

    expect(heroRequests, 'hidden banner image should not be downloaded on phones').toEqual([]);
    await context.close();
  });

  for (const vp of [{ name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 900 }]) {
    test(`${vp.name} (${vp.width}px): banner still shown`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto('/');
      const hero = page.locator('.homepage-hero');
      await expect(hero).toBeVisible();
      const box = await hero.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(300);
      await context.close();
    });
  }

  test('banner preload is media-qualified to match the CSS breakpoint', async ({ page }) => {
    await page.goto('/');
    const preload = page.locator(`link[rel="preload"][as="image"][href="${HERO_IMG}"]`);
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute('media', '(min-width: 641px)');
  });
});
