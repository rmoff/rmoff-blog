import { test, expect, Page } from '@playwright/test';

// Desktop header nav must stay on one line at every width down to 1025px
// (below that the hamburger menu takes over). It used to wrap: icons stacked
// above two-line labels once the window narrowed, or as soon as the web font
// hadn't loaded. Paths are relative to baseURL in playwright.config.ts.

async function sweep(page: Page) {
  const problems: string[] = [];
  // Both sides of each breakpoint in redesign.css. 1121px and 1281px matter most:
  // each is the narrowest width that still has the roomier rules above it.
  const widths = [1120, 1121, 1280, 1281];
  for (let width = 1025; width <= 1440; width += 15) widths.push(width);
  for (const width of widths) {
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
        about: [...nav.querySelectorAll('a')].filter(a => a.textContent!.trim() === 'About' && a.getBoundingClientRect().width > 0).length,
      };
    });
    if (r.wrapped.length) problems.push(`${width}px: wrapped ${r.wrapped.join(', ')}`);
    if (r.gap < 16) problems.push(`${width}px: only ${Math.round(r.gap)}px between title and nav`);
    if (r.headerHeight !== 60) problems.push(`${width}px: header is ${r.headerHeight}px tall`);
    if (r.overflow) problems.push(`${width}px: horizontal overflow`);
    if (r.about !== 1) problems.push(`${width}px: ${r.about} visible About links`);
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

// /about-me/ holds Robin's bio and contact email, but nothing linked to it and
// /about/ was a 404.
test.describe('About page can be found', () => {
  const ABOUT = /\/about-me\/$/;

  test('every desktop nav link is still there, with About added', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto('/');
    await expect(page.locator('.site-nav > a')).toHaveText([
      /Interesting Links/, /Categories/, /About/, /Search/, /RSS/,
    ]);
    await expect(page.locator('.site-nav > a', { hasText: 'About' })).toHaveAttribute('href', ABOUT);
  });

  test('desktop nav link opens the About page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto('/');
    await page.locator('.site-nav > a', { hasText: 'About' }).click();
    await expect(page).toHaveURL(ABOUT);
    await expect(page.locator('main a[href^="mailto:"]')).toBeVisible();
  });

  test('mobile menu links to it and marks it as the current page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('.nav-toggle').click();
    const link = page.locator('#mobile-nav .mobile-nav-primary a', { hasText: 'About' });
    await expect(link).toBeVisible();
    await expect(link).not.toHaveAttribute('aria-current', 'page');
    await link.click();
    await expect(page).toHaveURL(ABOUT);
    await page.locator('.nav-toggle').click();
    await expect(page.locator('#mobile-nav [aria-current="page"]')).toHaveText('About');
  });

  test('footer links to it', async ({ page }) => {
    for (const path of ['/', '/categories/', '/about-me/', '/no-such-page/']) {
      await page.goto(path);
      await expect(page.locator('.site-footer a', { hasText: 'About' })).toHaveAttribute('href', ABOUT);
    }
  });

  test('footer links all stay whole and on screen on a phone', async ({ page }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      const links = await page.locator('.site-footer a').evaluateAll(as => as.map(a => {
        const r = a.getBoundingClientRect();
        return { text: a.textContent!.trim(), left: r.left, right: r.right, height: r.height };
      }));
      expect(links.map(l => l.text)).toEqual(['@rmoff', 'About', 'AI Disclosure']);
      for (const l of links) {
        expect(l.left, `${l.text} at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(l.right, `${l.text} at ${width}px`).toBeLessThanOrEqual(width);
        expect(l.height, `${l.text} at ${width}px`).toBeLessThan(30);
      }
    }
  });

  test('sidebar name and photo both open it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto('/');
    const name = page.locator('.sidebar a', { hasText: 'Robin Moffatt' });
    // The other titles in this column are plain labels, so it has to look like a link.
    await expect(name).toHaveCSS('text-decoration-line', 'underline');
    await name.click();
    await expect(page).toHaveURL(ABOUT);
    await page.goto('/');
    await page.locator('.sidebar .author-avatar img').click();
    await expect(page).toHaveURL(ABOUT);
  });

  test('sidebar photo is not a second tab stop for the same link', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto('/');
    await expect(page.locator('.sidebar .author-avatar a')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('.sidebar .author-avatar a')).toHaveAttribute('aria-hidden', 'true');
  });

  test('/about/ redirects to /about-me/', async ({ page, request }) => {
    const res = await request.get('/about/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/http-equiv="?refresh"?\s+content="0; url=[^"]*\/about-me\/"/i);

    // The redirect target is built from baseURL, so a local build points at the
    // live site. Answer that request here and check the browser really follows it.
    await page.route(/\/about-me\/$/, route => route.fulfill({ status: 200, contentType: 'text/html', body: 'about me' }));
    await page.goto('/about/');
    await expect(page).toHaveURL(ABOUT);
  });
});
