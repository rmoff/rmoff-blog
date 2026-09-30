import { test, expect, Page } from '@playwright/test';

// Desktop header nav must stay on one line at every width down to 1025px
// (below that the hamburger menu takes over). It used to wrap: icons stacked
// above two-line labels once the window narrowed, or as soon as the web font
// hadn't loaded. Paths are relative to baseURL in playwright.config.ts.

async function sweep(page: Page) {
  const problems: string[] = [];
  for (let width = 1025; width <= 1440; width += 15) {
    await page.setViewportSize({ width, height: 800 });
    const r = await page.evaluate(() => {
      const nav = document.querySelector('.site-nav')!;
      const title = document.querySelector('.site-title')!;
      const wrapped = [...nav.children]
        .filter(e => getComputedStyle(e).display !== 'none')
        .filter(e => e.getBoundingClientRect().height > 30)
        .map(e => e.textContent!.trim() || e.className);
      return {
        wrapped,
        gap: nav.getBoundingClientRect().left - title.getBoundingClientRect().right,
        headerHeight: document.querySelector('.site-header')!.getBoundingClientRect().height,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    if (r.wrapped.length) problems.push(`${width}px: wrapped ${r.wrapped.join(', ')}`);
    if (r.gap < 16) problems.push(`${width}px: only ${Math.round(r.gap)}px between title and nav`);
    if (r.headerHeight !== 60) problems.push(`${width}px: header is ${r.headerHeight}px tall`);
    if (r.overflow) problems.push(`${width}px: horizontal overflow`);
  }
  return problems;
}

test.describe('Header nav at tighter desktop widths', () => {
  test('stays on one line with web fonts', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await sweep(page)).toEqual([]);
  });

  test('stays on one line with fallback fonts (web fonts blocked)', async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
    await page.goto('/');
    expect(await sweep(page)).toEqual([]);
  });

  test('⌘K hint shows only when there is room', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1440, height: 800 });
    await expect(page.locator('.site-nav .nav-kbd')).toBeVisible();
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.site-nav .nav-kbd')).toBeHidden();
  });
});
