import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// Every post ends with related posts plus older and newer links, between the
// article and the comments (layouts/partials/post-endings.html). Paths are
// relative to baseURL in playwright.config.ts.
const KAFKA_2018 = '/2018/08/02/kafka-listeners-explained/';
const DUCKDB_2025 = '/2025/03/20/building-a-data-pipeline-with-duckdb/';
const AI_2026 = '/2026/05/06/ai-slop-is-killing-online-communities/';
const OBIEE_2009 = '/2009/03/23/obiee-publisher-configuring-connection-to-clustered-bi-server/';
const NORMAL_POSTS = [KAFKA_2018, DUCKDB_2025, AI_2026, OBIEE_2009];

const OLDEST_POST = '/2009/03/23/finding-config-files-in-unix/';
const NO_CATEGORIES = '/2016/03/03/obihackers-irc-channel/';
const ROUNDUP = '/2026/08/20/interesting-links-august-2026/';
// This one's category is spelt "Interesting links", lower-case l.
const ROUNDUP_LOWERCASE = '/2025/02/03/interesting-links-february-2025/';
// Its related posts include "Kafka Connect - java.lang.IncompatibleClassChangeError",
// a long unbroken word that has to wrap on a phone.
const LONG_WORD_TITLE = '/2016/07/27/kafka-connect-jdbc-oracle-number-of-groups-must-be-positive/';

const NON_POSTS = [
  '/about-me/',
  '/ai/',
  '/talks/',
  '/talk/blog-writing-for-developers/',
  '/search/',
  '/',
  '/categories/kafka-connect/',
];

const SECTION = '.post-endings';
const RELATED_LINKS = `${SECTION} .post-row .post-title-link`;
const OLDER = `${SECTION} a[data-direction="older"]`;
const NEWER = `${SECTION} a[data-direction="newer"]`;

// Dark and light values of the page background (see redesign.css).
const LIGHT_BG = 'rgb(250, 248, 245)';
const DARK_BG = 'rgb(28, 25, 23)';

// The date and categories of a post come from its hidden search metadata.
async function postMeta(request: APIRequestContext, path: string) {
  const res = await request.get(path);
  expect(res.ok(), `${path} should load`).toBe(true);
  const html = await res.text();
  const date = html.match(/data-pagefind-sort="date:(\d{4}-\d{2}-\d{2})"/)?.[1];
  expect(date, `${path} should carry a date`).toBeTruthy();
  const categories = [...html.matchAll(/data-pagefind-filter="category">([^<]*)</g)].map(m =>
    m[1].toLowerCase(),
  );
  return { date: date!, categories };
}

async function relatedHrefs(page: Page) {
  return page.locator(RELATED_LINKS).evaluateAll(links => links.map(a => a.getAttribute('href')!));
}

function luminance(rgb: string) {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number).map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test.describe('Post endings: where the section appears', () => {
  for (const path of NORMAL_POSTS) {
    test(`${path} has it between the article and the comments`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(SECTION)).toHaveCount(1);
      const order = await page.evaluate(() => {
        const section = document.querySelector('.post-endings')!;
        const article = document.querySelector('article.article')!;
        const comments = document.getElementById('comments')!;
        return {
          afterArticle: !!(article.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING),
          beforeComments: !!(section.compareDocumentPosition(comments) & Node.DOCUMENT_POSITION_FOLLOWING),
        };
      });
      expect(order).toEqual({ afterArticle: true, beforeComments: true });
    });
  }

  for (const path of NON_POSTS) {
    test(`${path} does not have it`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.ok(), `${path} should load`).toBe(true);
      await expect(page.locator(SECTION)).toHaveCount(0);
    });
  }

  test('non-post pages keep their comments', async ({ page }) => {
    const res = await page.goto('/about-me/', { waitUntil: 'domcontentloaded' });
    expect(res?.ok()).toBe(true);
    await expect(page.locator('#comments')).toHaveCount(1);
  });

  test('is left out of the search index', async ({ page }) => {
    await page.goto(KAFKA_2018, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(SECTION)).toHaveCount(1);
    await expect(page.locator(`[data-pagefind-body] ${SECTION}`)).toHaveCount(0);
  });

  test('is hidden in print', async ({ page }) => {
    await page.goto(KAFKA_2018, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(SECTION)).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator(SECTION)).toBeHidden();
  });
});

test.describe('Post endings: related posts', () => {
  for (const path of NORMAL_POSTS) {
    test(`${path} lists up to three posts that share a category`, async ({ page, request }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const hrefs = await relatedHrefs(page);
      expect(hrefs.length).toBeGreaterThanOrEqual(1);
      expect(hrefs.length).toBeLessThanOrEqual(3);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      expect(hrefs).not.toContain(path);

      const own = await postMeta(request, path);
      for (const href of hrefs) {
        const related = await postMeta(request, href);
        expect(
          related.categories.filter(c => own.categories.includes(c)),
          `${href} should share a category with ${path}`,
        ).not.toHaveLength(0);
      }
    });

    test(`${path} lists no Interesting Links roundups`, async ({ page, request }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const hrefs = await relatedHrefs(page);
      expect(hrefs.length).toBeGreaterThanOrEqual(1);
      for (const href of hrefs) {
        const { categories } = await postMeta(request, href);
        expect(categories, href).not.toContain('interesting links');
      }
    });
  }

  for (const path of [ROUNDUP, ROUNDUP_LOWERCASE]) {
    test(`${path} lists other roundups`, async ({ page, request }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const hrefs = await relatedHrefs(page);
      expect(hrefs).toHaveLength(3);
      for (const href of hrefs) {
        const { categories } = await postMeta(request, href);
        expect(categories, href).toContain('interesting links');
      }
    });
  }

  test('a post with no categories has no empty heading', async ({ page }) => {
    await page.goto(NO_CATEGORIES, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(RELATED_LINKS)).toHaveCount(0);
    await expect(page.locator(`${SECTION} h2`)).toHaveCount(0);
    await expect(page.locator(OLDER)).toHaveCount(1);
    await expect(page.locator(NEWER)).toHaveCount(1);
  });

  test('thumbnails add no nameless links', async ({ page }) => {
    await page.goto(KAFKA_2018, { waitUntil: 'domcontentloaded' });
    const thumbLinks = page.locator(`${SECTION} a:has(img)`);
    expect(await thumbLinks.count()).toBeGreaterThanOrEqual(1);
    for (const link of await thumbLinks.all()) {
      await expect(link).toHaveAttribute('aria-hidden', 'true');
      await expect(link).toHaveAttribute('tabindex', '-1');
    }
    const names = await page
      .locator(`${SECTION} a:not([aria-hidden="true"])`)
      .evaluateAll(links => links.map(a => a.textContent!.trim()));
    expect(names.length).toBeGreaterThanOrEqual(3);
    for (const name of names) expect(name).not.toBe('');
  });

  test('clicking a thumbnail opens the post, not the image lightbox', async ({ page }) => {
    await page.goto(KAFKA_2018);
    const link = page.locator(`${SECTION} a:has(img)`).first();
    const href = await link.getAttribute('href');
    await link.locator('img').scrollIntoViewIfNeeded();
    await expect(link.locator('img')).toHaveJSProperty('complete', true);
    // A resize makes lightbox.js look at the images again. Checked directly, because
    // a link still navigates with the lightbox attached to its image.
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await expect(link.locator('img')).not.toHaveClass(/lightbox-zoom/);
    await link.locator('img').click();
    await page.waitForURL(`**${href}`, { timeout: 5000 });
  });

  test('clicking anywhere on a row opens the post', async ({ page }) => {
    await page.goto(KAFKA_2018, { waitUntil: 'domcontentloaded' });
    const row = page.locator(`${SECTION} .post-row`).first();
    const href = await row.locator('.post-title-link').getAttribute('href');
    // Click the spot, as a visitor does. The title link is stretched over the row,
    // so Playwright won't click the date element itself (see click-row.spec.ts).
    const date = row.locator('.post-date');
    await date.scrollIntoViewIfNeeded();
    const box = (await date.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForURL(`**${href}`, { timeout: 5000 });
  });
});

test.describe('Post endings: older and newer links', () => {
  for (const path of NORMAL_POSTS) {
    if (path === OBIEE_2009) continue; // covered below: only a day from the oldest post
    test(`${path} links to its neighbours in date order, both ways`, async ({ page, request }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const older = (await page.locator(OLDER).getAttribute('href'))!;
      const newer = (await page.locator(NEWER).getAttribute('href'))!;
      const here = (await postMeta(request, path)).date;
      expect((await postMeta(request, older)).date <= here).toBe(true);
      expect((await postMeta(request, newer)).date >= here).toBe(true);

      await page.goto(older, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(NEWER)).toHaveAttribute('href', path);
      await page.goto(newer, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(OLDER)).toHaveAttribute('href', path);
    });
  }

  test('the links name the post they go to', async ({ page, request }) => {
    await page.goto(KAFKA_2018, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(OLDER)).toContainText('Older');
    await expect(page.locator(NEWER)).toContainText('Newer');
    const older = (await page.locator(OLDER).getAttribute('href'))!;
    const html = await (await request.get(older)).text();
    const title = html.match(/<title>([^<]*)<\/title>/)![1].trim();
    await expect(page.locator(OLDER)).toContainText(title);
  });

  test('the oldest post has only a newer link, on the right', async ({ page }) => {
    await page.goto(OLDEST_POST, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(OLDER)).toHaveCount(0);
    await expect(page.locator(NEWER)).toHaveCount(1);
    const box = (await page.locator(NEWER).boundingBox())!;
    const section = (await page.locator(SECTION).boundingBox())!;
    expect(box.x).toBeGreaterThan(section.x + section.width / 3);
  });

  test('the newest post has only an older link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const newest = (await page.locator('.featured-post-title a').getAttribute('href'))!;
    await page.goto(newest, { waitUntil: 'domcontentloaded' });
    await expect(page.locator(NEWER)).toHaveCount(0);
    await expect(page.locator(OLDER)).toHaveCount(1);
  });

  test('sit side by side on a desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(KAFKA_2018, { waitUntil: 'domcontentloaded' });
    const older = (await page.locator(OLDER).boundingBox())!;
    const newer = (await page.locator(NEWER).boundingBox())!;
    expect(older.y).toBe(newer.y);
    expect(older.x + older.width).toBeLessThanOrEqual(newer.x);
  });

  test('stack on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(KAFKA_2018, { waitUntil: 'domcontentloaded' });
    const older = (await page.locator(OLDER).boundingBox())!;
    const newer = (await page.locator(NEWER).boundingBox())!;
    expect(older.y + older.height).toBeLessThanOrEqual(newer.y);
    expect(older.width).toBe(newer.width);
  });
});

test.describe('Post endings: fits every screen', () => {
  for (const width of [320, 390, 768]) {
    for (const path of [KAFKA_2018, LONG_WORD_TITLE]) {
      test(`nothing on ${path} runs off a ${width}px screen`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await expect(page.locator(SECTION)).toBeVisible();
        // Element by element, because the site hides sideways overflow at 640px and
        // below, so the page's scroll width can't show it. An edge check alone isn't
        // enough either: text can spill out of a box whose own edge stays on screen.
        const over = await page.locator(`${SECTION}, ${SECTION} *`).evaluateAll(
          (els, w) =>
            els
              .filter(el => getComputedStyle(el).display !== 'none')
              .filter(el => el.getBoundingClientRect().right > w || el.scrollWidth > el.clientWidth + 1)
              .filter(el => el.clientWidth > 0)
              .map(el => el.className || el.tagName),
          width,
        );
        expect(over).toEqual([]);
      });
    }
  }
});

for (const [scheme, background] of [['light', LIGHT_BG], ['dark', DARK_BG]] as const) {
  test.describe(`Post endings: ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test('text is readable', async ({ page }) => {
      await page.goto(KAFKA_2018, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toHaveCSS('background-color', background);
      const selectors = [
        `${SECTION} h2`,
        `${SECTION} .post-title-link`,
        `${SECTION} .post-date`,
        `${SECTION} .post-nav-label`,
        `${SECTION} .post-nav-title`,
      ];
      for (const selector of selectors) {
        const color = await page.locator(selector).first().evaluate(el => getComputedStyle(el).color);
        expect(contrast(color, background), selector).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
}
