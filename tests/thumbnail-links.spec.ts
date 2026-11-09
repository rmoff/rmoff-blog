import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// A post's thumbnail and title both link to the post. The thumbnail is hidden
// from screen readers and the Tab key, so each post is one named link and one
// tab stop, while the image stays clickable by mouse and touch.
//
// The search cases need a full build with a Pagefind index (see search.spec.ts).

const HOME_LINKS = '.featured-post-title a, .post-row .post-title-link';
const CATEGORY = '/categories/kafka-connect/';
const CATEGORY_INPUT = '#category-search-input';
const CATEGORY_LINKS = '#category-article-list .post-title-link';
const CATEGORY_SEARCH_LINKS = '#category-search-results .post-title-link';
const SEARCH_LINKS = '.cr-result-title';

async function searchCategory(page: Page) {
  await page.goto(CATEGORY);
  // Typing before the page's search script has loaded is lost, so try again
  await expect(async () => {
    await page.locator(CATEGORY_INPUT).fill('');
    await page.locator(CATEGORY_INPUT).fill('kafka');
    await expect(page.locator(CATEGORY_SEARCH_LINKS).first()).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 20000 });
}

async function searchSite(page: Page) {
  await page.goto('/search/?q=flink');
  await expect(page.locator(SEARCH_LINKS).first()).toBeVisible({ timeout: 10000 });
}

async function expectLinksNamed(page: Page, links: Locator) {
  const visible = await links.locator('visible=true').count();
  expect(visible).toBeGreaterThan(0);
  const { violations, passes } = await new AxeBuilder({ page })
    .withRules(['link-name', 'aria-hidden-focus'])
    .analyze();
  expect(violations.flatMap(v => v.nodes.map(n => `${v.id}: ${n.html}`))).toEqual([]);
  // Guards against a pass that comes from axe not finding any links
  const linkName = passes.find(p => p.id === 'link-name');
  expect(linkName?.nodes.length ?? 0).toBeGreaterThanOrEqual(visible);
}

// Press Tab, from the top of the page or from a control above the posts, and
// return the link at each stop inside a post. Stops elsewhere (site navigation,
// year headings) are skipped.
async function postStops(page: Page, count: number, start?: Locator) {
  if (start) await start.focus();
  const stops: (string | null)[] = [];
  for (let press = 0; stops.length < count && press < count * 3 + 50; press++) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('.featured-post, .post-row, .cr-result') ? { href: el.getAttribute('href') } : null;
    });
    if (stop) stops.push(stop.href);
  }
  return stops;
}

// The first posts' title links, in page order, and nothing else
async function expectOneStopPerPost(page: Page, links: Locator, count: number, start?: Locator) {
  const expected = (await links.locator('visible=true').evaluateAll(as => as.map(a => a.getAttribute('href')))).slice(0, count);
  expect(expected.length).toBe(count);
  expect(new Set(expected).size).toBe(count);
  expect(await postStops(page, count, start)).toEqual(expected);
}

test.describe('Thumbnail links', () => {
  test('home page links all have names', async ({ page }) => {
    await page.goto('/');
    await expectLinksNamed(page, page.locator(HOME_LINKS));
  });

  test('category page links all have names, in every year', async ({ page }) => {
    await page.goto(CATEGORY);
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
    await expectLinksNamed(page, page.locator(CATEGORY_LINKS));
  });

  test('category search result links all have names', async ({ page }) => {
    await searchCategory(page);
    await expectLinksNamed(page, page.locator(CATEGORY_SEARCH_LINKS));
  });

  test('search result links all have names', async ({ page }) => {
    await searchSite(page);
    await expectLinksNamed(page, page.locator(SEARCH_LINKS));
  });

  test('home page: Tab stops once on each post', async ({ page }) => {
    await page.goto('/');
    const links = page.locator(HOME_LINKS);
    await expectOneStopPerPost(page, links, await links.locator('visible=true').count());
  });

  test('category page: Tab stops once on each post', async ({ page }) => {
    await page.goto(CATEGORY);
    await expectOneStopPerPost(page, page.locator(CATEGORY_LINKS), 10, page.locator(CATEGORY_INPUT));
  });

  test('category search: Tab stops once on each post', async ({ page }) => {
    await searchCategory(page);
    await expectOneStopPerPost(page, page.locator(CATEGORY_SEARCH_LINKS), 10, page.locator(CATEGORY_INPUT));
  });

  test('search results: Tab stops once on each post', async ({ page }) => {
    await searchSite(page);
    await expectOneStopPerPost(page, page.locator(SEARCH_LINKS), 10, page.locator('.pagefind-ui__search-input'));
  });

  // Clicks by position, as a mouse does: a row's title link stretches over its
  // thumbnail, so what handles the click is not always the thumbnail link.
  async function expectClickOpensPost(page: Page, thumb: Locator) {
    const href = await thumb.getAttribute('href');
    expect(href).toBeTruthy();
    expect(await thumb.locator('img').getAttribute('alt')).toBe('');
    // Early in a new year, every year section on the home page starts closed
    await thumb.evaluate(a => { const year = a.closest('details'); if (year) year.open = true; });
    await thumb.scrollIntoViewIfNeeded();
    const box = await thumb.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    // 'commit' because only the navigation matters here, not how fast the post loads
    await page.waitForURL(`**${href}`, { timeout: 5000, waitUntil: 'commit' });
  }

  test('clicking the featured post thumbnail opens the post', async ({ page }) => {
    await page.goto('/');
    await expectClickOpensPost(page, page.locator('.featured-post-thumb-link'));
  });

  test('clicking a post row thumbnail opens the post', async ({ page }) => {
    await page.goto('/');
    await expectClickOpensPost(page, page.locator('.post-row .post-thumb-link').first());
  });

  test('clicking a category search thumbnail opens the post', async ({ page }) => {
    await searchCategory(page);
    await expectClickOpensPost(page, page.locator('#category-search-results .post-thumb-link').first());
  });

  test('clicking a search result thumbnail opens the post', async ({ page }) => {
    await searchSite(page);
    await expectClickOpensPost(page, page.locator('.cr-result-thumb').first());
  });
});
