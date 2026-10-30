import { test, expect, type Page } from '@playwright/test';

// The Popular list on /categories/ comes from layouts/partials/popular-categories.html.
// Ranking is recency-weighted on purpose, but what a reader sees has to agree with the
// page each entry links to. Nothing here hard-codes a count: they change with every post.

type Entry = { href: string; name: string; count: number };
type Destination = { title: string; heroCount: number; posts: string[]; recent: number };

const RECENT_FROM_YEAR = 2017; // the cutoff in popular-categories.html

async function popularEntries(page: Page): Promise<Entry[]> {
  await page.goto('/categories/');
  return page.locator('.cat-popular-grid a.cat-popular-item').evaluateAll(links =>
    links.map(a => ({
      href: a.getAttribute('href') ?? '',
      name: a.querySelector('span:not(.cat-count)')?.textContent?.trim() ?? '',
      count: Number(a.querySelector('.cat-count')?.textContent),
    })),
  );
}

// What a reader finds on a category page: its heading, the "N articles" line under it,
// and the posts themselves, with how many of those are recent enough to count towards
// ranking. Interesting Links shows its latest issue in a card above the list, so that
// card counts as a post too.
async function destination(page: Page, href: string): Promise<Destination> {
  const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `${href} should load`).toBe(200);
  return page.evaluate(fromYear => {
    const links = document.querySelectorAll<HTMLAnchorElement>(
      '#category-article-list .post-title-link, .il-landing-latest-link',
    );
    const dates = [...document.querySelectorAll('#category-article-list .post-date, .il-landing-date')];
    return {
      title: document.querySelector('.page-hero-content h1')?.textContent?.trim() ?? '',
      heroCount: parseInt(document.querySelector('.page-hero-content p')?.textContent ?? '', 10),
      posts: [...new Set([...links].map(a => a.getAttribute('href') ?? ''))].sort(),
      recent: dates.filter(d => Number(d.textContent?.trim().slice(-4)) >= fromYear).length,
    };
  }, RECENT_FROM_YEAR);
}

test.describe('Popular categories', () => {
  test('every entry shows the name and count of the page it links to', async ({ page }) => {
    test.setTimeout(120_000);
    const entries = await popularEntries(page);
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      const dest = await destination(page, entry.href);
      expect.soft(entry.name, `${entry.href} name`).toBe(dest.title);
      expect.soft(entry.count, `${entry.name} count against "N articles"`).toBe(dest.heroCount);
      expect.soft(entry.count, `${entry.name} count against posts listed`).toBe(dest.posts.length);
    }
  });

  test('shows the top 13 in alphabetical order', async ({ page }) => {
    const names = (await popularEntries(page)).map(e => e.name);
    expect(names).toHaveLength(13);
    const collator = new Intl.Collator('en', { sensitivity: 'base' });
    expect(names).toEqual([...names].sort(collator.compare));
  });

  test('a category written in two cases is counted once, under its page title', async ({ page }) => {
    const names = (await popularEntries(page)).map(e => e.name);
    expect(names).toContain('Kafka Connect');
    expect(names).toContain('Apache Kafka');
    expect(names).not.toContain('kafka connect');
  });

  test('ranking stays recency-weighted: old OBIEE posts do not put it on the list', async ({ page }) => {
    const names = (await popularEntries(page)).map(e => e.name);
    expect(names).toHaveLength(13);
    expect(names).not.toContain('OBIEE');
  });

  test('no category left off the list has more recent posts than one on it', async ({ page }) => {
    test.setTimeout(300_000);
    const entries = await popularEntries(page);
    const listed: Destination[] = [];
    for (const entry of entries) listed.push(await destination(page, entry.href));
    const lowest = Math.min(...listed.map(d => d.recent));
    expect(lowest).toBeGreaterThan(0);

    // Recent posts can't exceed a category's total, so only categories with a bigger
    // total than `lowest` could have been wrongly left out.
    await page.goto('/categories/');
    const others = await page.locator('.cat-by-letter a.cat-item').evaluateAll(links =>
      links.map(a => ({
        href: a.getAttribute('href') ?? '',
        name: a.querySelector('span:not(.cat-count)')?.textContent?.trim() ?? '',
        count: Number(a.querySelector('.cat-count')?.textContent),
      })),
    );
    const onList = new Set(entries.map(e => e.href));
    const sameAsListed = new Set(listed.map(d => d.posts.join(' ')));

    for (const other of others.filter(o => o.count > lowest && !onList.has(o.href))) {
      const dest = await destination(page, other.href);
      if (sameAsListed.has(dest.posts.join(' '))) continue; // listed under its twin's name
      expect.soft(dest.recent, `${other.name} has more recent posts than a listed category`)
        .toBeLessThanOrEqual(lowest);
    }
  });

  test('two categories holding exactly the same posts appear once', async ({ page }) => {
    test.setTimeout(120_000);
    const entries = await popularEntries(page);
    const seen = new Map<string, string>();
    for (const entry of entries) {
      const key = (await destination(page, entry.href)).posts.join(' ');
      expect.soft(seen.get(key), `${entry.name} duplicates another entry`).toBeUndefined();
      seen.set(key, entry.name);
    }
  });
});

test.describe('Other users of the Popular ranking', () => {
  test('search palette Top categories use real names, live links and the same ranking', async ({ page, request }) => {
    test.setTimeout(120_000);
    const { top } = await (await request.get('/search-palette.json')).json();
    expect(top).toHaveLength(8);
    const popular = (await popularEntries(page)).map(e => e.href);

    const recent: number[] = [];
    for (const { n, s } of top) {
      const href = `/categories/${s}/`;
      expect.soft(popular, `${n} should also be in the Popular list`).toContain(href);
      const dest = await destination(page, href);
      expect.soft(dest.title).toBe(n);
      recent.push(dest.recent);
    }
    expect(recent, 'most recent posts first').toEqual([...recent].sort((a, b) => b - a));

    // The rest of the Popular list ranks below all eight.
    const inPalette = new Set(top.map(({ s }) => `/categories/${s}/`));
    for (const href of popular.filter(h => !inPalette.has(h))) {
      expect.soft((await destination(page, href)).recent, href)
        .toBeLessThanOrEqual(Math.min(...recent));
    }
  });

  test('the /search/ suggestions still list working category links', async ({ page }) => {
    await page.goto('/search/');
    const hrefs = await page.locator('#search-suggestions a').evaluateAll(links =>
      links.map(a => a.getAttribute('href') ?? ''),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect.soft((await page.request.get(href)).status(), href).toBe(200);
    }
  });
});
