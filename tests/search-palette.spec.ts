import { test, expect, type Page } from '@playwright/test';

// ⌘K search palette (static/js/search-palette.js).
// Needs a full build with a Pagefind index (the dev server has none) — see
// tests/search.spec.ts for how to build + serve one, then run with BASE_URL.

const ARTICLE = '/2019/08/15/reset-kafka-connect-source-connector-offsets/';
const palette = (page: Page) => page.locator('dialog.sp');
const input = (page: Page) => page.locator('.sp-input');

async function openWithShortcut(page: Page, key = 'ControlOrMeta+k') {
  await page.keyboard.press(key);
  await expect(palette(page)).toBeVisible();
  await expect(input(page)).toBeFocused();
}

async function search(page: Page, q: string) {
  await input(page).fill(q);
  // wait for the results groups, not the empty state's recent posts
  await expect(page.locator('[aria-labelledby="sp-g-posts"] .sp-post').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Search palette', () => {
  test('ordinary page load fetches only the small palette script', async ({ page }) => {
    const urls: string[] = [];
    page.on('request', r => urls.push(new URL(r.url()).pathname));
    await page.goto(ARTICLE);
    await page.waitForLoadState('networkidle');

    expect(urls.filter(u => /search-palette.*\.js$/.test(u))).toHaveLength(1);
    expect(urls.filter(u => /search-palette.*\.css$|search-palette\.json|\/pagefind\//.test(u))).toEqual([]);
    await expect(palette(page)).toHaveCount(0); // dialog is built on first open

    await openWithShortcut(page);
    await expect.poll(() => urls.filter(u => /search-palette.*\.css$/.test(u)).length).toBe(1);
    await expect.poll(() => urls.includes('/search-palette.json')).toBe(true);
    await expect.poll(() => urls.includes('/pagefind/pagefind.js')).toBe(true);
  });

  test('opens with ⌘K and with Ctrl+K; Esc closes and restores focus', async ({ page }) => {
    await page.goto(ARTICLE);
    const rss = page.locator('.site-nav a', { hasText: 'RSS' });
    await rss.focus();

    await openWithShortcut(page, 'Meta+k');
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
    await expect(rss).toBeFocused();

    await openWithShortcut(page, 'Control+k');
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
  });

  test('shortcut label matches the platform', async ({ page }) => {
    await page.goto('/');
    const isApple = await page.evaluate(() => /mac|iphone|ipad|ipod/i.test(
      (navigator as any).userAgentData?.platform || navigator.platform));
    await expect(page.locator('.nav-kbd')).toHaveText(isApple ? '⌘K' : 'Ctrl K');
  });

  test('header Search link opens the palette; backdrop click closes it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ARTICLE);
    await page.locator('.site-nav a[data-search-palette]').click();
    await expect(palette(page)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(ARTICLE + '$'));

    await page.mouse.click(10, 880); // outside the panel
    await expect(palette(page)).toBeHidden();
  });

  test('modified click on the Search link still opens /search/ normally', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ARTICLE);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('.site-nav a[data-search-palette]').click({ modifiers: ['ControlOrMeta'] }),
    ]);
    await newPage.waitForURL('**/search/');
    await expect(palette(page)).toHaveCount(0);
  });

  test('empty state shows recent posts, popular posts and top categories', async ({ page }) => {
    // The popular-posts Worker only allows rmoff.net / localhost:1313-1314 origins; stub it
    await page.route(url => url.pathname === '/top-posts', route => route.fulfill({
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ posts: Array.from({ length: 10 }, (_, i) => ({ url: `/popular-${i}/`, title: `Popular ${i}` })) }),
    }));
    await page.goto(ARTICLE);
    await openWithShortcut(page);

    const labels = page.locator('.sp-group-label');
    await expect(labels).toHaveText(['Recent posts', 'Popular posts', 'Top categories']);
    await expect(page.locator('[aria-labelledby="sp-g-recent"] .sp-post')).toHaveCount(5);
    await expect(page.locator('[aria-labelledby="sp-g-popular"] .sp-post')).toHaveCount(5);
    await expect(page.locator('[aria-labelledby="sp-g-topcats"] .sp-chip').first()).toBeVisible();
    await expect(page.locator('.sp-all')).toHaveAttribute('href', '/search/');
    // nothing pre-selected, so Enter on an empty query goes nowhere by accident
    await expect(input(page)).not.toHaveAttribute('aria-activedescendant');
  });

  test('popular posts group is omitted when the Worker is unreachable', async ({ page }) => {
    await page.route(url => url.pathname === '/top-posts', route => route.abort());
    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await expect(page.locator('.sp-group-label').first()).toHaveText('Recent posts');
    await expect(page.locator('#sp-g-popular')).toHaveCount(0);
  });

  test('typing shows matching categories then posts, with ARIA wiring', async ({ page }) => {
    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await search(page, 'kafka connect');

    await expect(page.locator('.sp-group-label')).toHaveText(['Categories', 'Posts']);
    await expect(page.locator('.sp-group-cats .sp-chip').first()).toContainText('Kafka Connect');
    await expect(page.locator('.sp-group-cats .sp-chip').first()).toHaveAttribute('href', '/categories/kafka-connect/');
    const posts = page.locator('.sp-post');
    expect(await posts.count()).toBeLessThanOrEqual(8);
    await expect(posts.first().locator('.sp-post-date')).toHaveText(/\d{4}$/);
    await expect(posts.first().locator('.sp-post-excerpt mark').first()).toBeVisible();

    await expect(input(page)).toHaveAttribute('role', 'combobox');
    await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(input(page)).toHaveAttribute('aria-controls', 'sp-list');
    await expect(page.locator('#sp-list')).toHaveAttribute('role', 'listbox');
    // top post is active by default
    const firstPostId = await posts.first().getAttribute('id');
    await expect(input(page)).toHaveAttribute('aria-activedescendant', firstPostId!);
    await expect(posts.first()).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.sp-status')).toHaveText(/^\d+ results, \d+ matching categor(y|ies)$/);
    await expect(page.locator('.sp-all')).toHaveText(/^See all \d+ results →$/);
  });

  test('palette excerpts have no run-together category names or 🔗', async ({ page }) => {
    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await search(page, 'kafka connect');
    const texts = await page.locator('.sp-post-excerpt').allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    for (const t of texts) {
      expect(t).not.toMatch(/Kafka Connect(offsets|REST|JDBC|Docker)/);
      expect(t).not.toContain('🔗');
    }
    // ~25 words (was 10 on /search/)
    expect(Math.max(...texts.map(t => t.split(/\s+/).filter(Boolean).length))).toBeGreaterThanOrEqual(20);
  });

  test('arrow keys move through categories and posts; Enter opens the active item', async ({ page }) => {
    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await search(page, 'kafka connect');

    const options = page.locator('#sp-list [role="option"]');
    const posts = page.locator('.sp-post');
    const chips = page.locator('.sp-group-cats .sp-chip');
    const nChips = await chips.count();
    expect(nChips).toBeGreaterThan(0);

    await page.keyboard.press('ArrowDown');
    await expect(posts.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(posts.first()).toHaveAttribute('aria-selected', 'false');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp'); // from the first post up into the categories
    await expect(chips.nth(nChips - 1)).toHaveClass(/is-active/);

    // mouse hover syncs the active item
    await posts.nth(2).hover();
    await expect(posts.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#sp-list [aria-selected="true"]')).toHaveCount(1);

    // wraps from the first option to the last
    for (let i = 0; i < 2 + nChips; i++) await page.keyboard.press('ArrowUp');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await expect(options.last()).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowDown'); // back to the first category chip
    const href = await options.first().getAttribute('href');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(href! + '$'));
  });

  test('Enter opens the top post; ⌘/Ctrl+Enter goes to the full results page', async ({ page }) => {
    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await search(page, 'kafka connect');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(page).toHaveURL(/\/search\/\?q=kafka%20connect$/);
    await expect(page.locator('.pagefind-ui__search-input')).toHaveValue('kafka connect');

    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await search(page, 'kafka connect');
    const href = await page.locator('.sp-post').first().getAttribute('href');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(href! + '$'));
  });

  test('reopening keeps the previous query, selected', async ({ page }) => {
    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await search(page, 'duckdb');
    await page.keyboard.press('Escape');
    await openWithShortcut(page);
    await expect(input(page)).toHaveValue('duckdb');
    expect(await input(page).evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd])).toEqual([0, 6]);
    await expect(page.locator('.sp-post').first()).toBeVisible();
  });

  test('no-results state', async ({ page }) => {
    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await input(page).fill('ÞÞÞÞÞ');
    await expect(page.locator('.sp-msg')).toHaveText('No results for “ÞÞÞÞÞ”.');
    await expect(page.locator('#sp-list [role="option"]')).toHaveCount(0);
    await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.sp-status')).toHaveText('No results');
  });

  test('search-unavailable state when Pagefind is missing (e.g. dev server)', async ({ page }) => {
    await page.route('**/pagefind/pagefind.js', route => route.fulfill({ status: 404, body: '' }));
    await page.goto(ARTICLE);
    await openWithShortcut(page);
    await expect(page.locator('[aria-labelledby="sp-g-recent"] .sp-post')).toHaveCount(5); // JSON still works
    await input(page).fill('kafka');
    await expect(page.locator('.sp-msg')).toContainText('Search is unavailable');
  });

  test('on /search/ the shortcut focuses the page input instead', async ({ page }) => {
    await page.goto('/search/');
    const own = page.locator('.pagefind-ui__search-input');
    await expect(own).toBeFocused();
    await page.locator('h1').click();
    await page.keyboard.press('ControlOrMeta+k');
    await expect(own).toBeFocused();
    await expect(palette(page)).toHaveCount(0);
  });

  test('mobile: nav Search link opens a full-width palette without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ARTICLE);
    await page.locator('.nav-toggle').click();
    await page.locator('.mobile-nav a[data-search-palette]').click();
    await expect(palette(page)).toBeVisible();
    await expect(page.locator('.mobile-nav')).not.toHaveClass(/open/);
    await search(page, 'kafka connect');

    const panel = await page.locator('.sp-panel').boundingBox();
    expect(panel!.x).toBe(0);
    expect(panel!.width).toBe(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.locator('.sp-close').click();
    await expect(palette(page)).toBeHidden();
  });
});
