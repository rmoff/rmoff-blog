import { test, expect, type Page } from '@playwright/test';

const mobileViewport = { width: 375, height: 812 };

// Viewports for the overflow checks. Tablet (768px) matters because the
// `html, body { overflow-x: hidden }` safety net only kicks in at <=640px, so
// above that any over-wide content produces a genuinely scrollable, broken page.
const overflowViewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
];

const pages = [
  { name: 'homepage', url: '/' },
  { name: 'article', url: '/2026/01/14/alternatives-to-minio-for-single-node-local-s3/' },
  { name: 'interesting-links', url: '/2026/01/20/interesting-links-january-2026/' },
  { name: 'categories', url: '/categories/' },
  { name: 'category-term', url: '/categories/apache-kafka/' },
];

// The Popular posts widget is injected asynchronously by top-posts.js. Its
// titles are `white-space: nowrap`, so they are exactly the content that can
// blow out the layout — the overflow checks are only meaningful once it has
// rendered. If the widget is present on the page, fail loudly when it never
// populates rather than silently testing an empty (and therefore narrow)
// sidebar, which is how the mobile overflow regression slipped through.
async function waitForPopularPosts(p: Page) {
  const widgetCount = await p.locator('.top-posts').count();
  if (widgetCount === 0) return;
  await expect(
    p.locator('.top-posts-list a').first(),
    'Popular posts widget present but never populated — overflow check would be a false pass',
  ).toBeVisible({ timeout: 10000 });
}

for (const page of pages) {
  for (const vp of overflowViewports) {
    test(`${vp.name}: no horizontal overflow on ${page.name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const p = await context.newPage();
      await p.goto(`http://localhost:1313${page.url}`, { waitUntil: 'networkidle' });
      await waitForPopularPosts(p);

      // Check that the page doesn't have horizontal overflow. We check the
      // documentElement too: below 640px `body { overflow-x: hidden }` clamps
      // body.scrollWidth, so body alone can mask real overflow.
      const { bodyScrollWidth, docScrollWidth, windowWidth } = await p.evaluate(() => ({
        bodyScrollWidth: document.body.scrollWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        windowWidth: window.innerWidth,
      }));
      expect(bodyScrollWidth, `${page.name} @${vp.width}px: body scrollWidth (${bodyScrollWidth}) should not exceed viewport width (${windowWidth})`).toBeLessThanOrEqual(windowWidth + 1);
      expect(docScrollWidth, `${page.name} @${vp.width}px: documentElement scrollWidth (${docScrollWidth}) should not exceed viewport width (${windowWidth})`).toBeLessThanOrEqual(windowWidth + 1);

      await context.close();
    });
  }

  test(`mobile: text is readable on ${page.name}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: mobileViewport });
    const p = await context.newPage();
    await p.goto(`http://localhost:1313${page.url}`, { waitUntil: 'networkidle' });
    await waitForPopularPosts(p);

    // Check that the main content area doesn't have elements clipped off-screen
    // (skip elements inside scrollable containers - those are intentionally scrollable)
    const overflowingElements = await p.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const problems: string[] = [];

      function hasScrollableParent(el: Element): boolean {
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          const style = getComputedStyle(parent);
          const overflowX = style.overflowX;
          if ((overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') &&
              parent.scrollWidth > parent.clientWidth) {
            return true;
          }
          parent = parent.parentElement;
        }
        return false;
      }

      const allElements = document.querySelectorAll('main *');
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.right > viewportWidth + 5) {
          // Skip elements inside scrollable containers
          if (hasScrollableParent(el)) continue;
          const tag = el.tagName.toLowerCase();
          const cls = el.className?.toString().slice(0, 50) || '';
          problems.push(`${tag}.${cls} right=${Math.round(rect.right)}px`);
        }
      }
      return problems.slice(0, 10);
    });
    expect(overflowingElements, `${page.name}: elements overflow viewport`).toEqual([]);

    await context.close();
  });
}

test('mobile: hamburger menu opens and shows links', async ({ browser }) => {
  const context = await browser.newContext({ viewport: mobileViewport });
  const p = await context.newPage();
  await p.goto('http://localhost:1313/', { waitUntil: 'networkidle' });

  // Desktop nav should be hidden
  const desktopNav = p.locator('.site-nav');
  await expect(desktopNav).toBeHidden();

  // Hamburger should be visible
  const hamburger = p.locator('.nav-toggle');
  await expect(hamburger).toBeVisible();

  // Click hamburger
  await hamburger.click();

  // Mobile nav should open
  const mobileNav = p.locator('.mobile-nav');
  await expect(mobileNav).toBeVisible();

  // Should have links
  const links = mobileNav.locator('a');
  expect(await links.count()).toBeGreaterThan(3);

  await context.close();
});

test('mobile: featured post stacks vertically', async ({ browser }) => {
  const context = await browser.newContext({ viewport: mobileViewport });
  const p = await context.newPage();
  await p.goto('http://localhost:1313/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  const featured = p.locator('.featured-post');
  if (await featured.count() > 0) {
    const box = await featured.boundingBox();
    expect(box).toBeTruthy();

    // The featured post title should be readable - check it fits in viewport
    const titleBox = await p.locator('.featured-post-title').boundingBox();
    expect(titleBox).toBeTruthy();
    if (titleBox) {
      expect(titleBox.width).toBeLessThanOrEqual(mobileViewport.width);
    }
  }

  await context.close();
});

test('mobile: post rows have adequate touch targets', async ({ browser }) => {
  const context = await browser.newContext({ viewport: mobileViewport });
  const p = await context.newPage();
  await p.goto('http://localhost:1313/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  const rows = p.locator('.post-row');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  // Each row should be at least 44px tall (Apple HIG minimum)
  for (let i = 0; i < Math.min(count, 5); i++) {
    const box = await rows.nth(i).boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.height, `post row ${i} height`).toBeGreaterThanOrEqual(44);
    }
  }

  await context.close();
});

test('mobile: article content fits viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport: mobileViewport });
  const p = await context.newPage();
  await p.goto('http://localhost:1313/2026/01/14/alternatives-to-minio-for-single-node-local-s3/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  // Code blocks should have overflow-x auto and not push page wider
  const bodyScrollWidth = await p.evaluate(() => document.body.scrollWidth);
  expect(bodyScrollWidth).toBeLessThanOrEqual(mobileViewport.width + 1);

  // Article body should not be wider than viewport
  const articleWidth = await p.evaluate(() => {
    const el = document.querySelector('.docs-content') || document.querySelector('.article-main');
    return el ? el.scrollWidth : 0;
  });
  expect(articleWidth).toBeLessThanOrEqual(mobileViewport.width);

  await context.close();
});

test('mobile: mobile TOC is shown on article pages', async ({ browser }) => {
  const context = await browser.newContext({ viewport: mobileViewport });
  const p = await context.newPage();
  await p.goto('http://localhost:1313/2026/01/14/alternatives-to-minio-for-single-node-local-s3/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);

  // Desktop TOC should be hidden
  const desktopToc = p.locator('.docs-toc');
  // It should either not exist or be hidden
  if (await desktopToc.count() > 0) {
    await expect(desktopToc).toBeHidden();
  }

  // Mobile TOC should be visible
  const mobileToc = p.locator('.toc-mobile');
  if (await mobileToc.count() > 0) {
    await expect(mobileToc).toBeVisible();
  }

  await context.close();
});
