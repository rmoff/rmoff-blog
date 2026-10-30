import { test, expect, Page } from '@playwright/test';

// Every post says who wrote it: a visible byline beside the date, plus the
// metadata search engines and link previews read (meta author,
// article:published_time and JSON-LD BlogPosting). Posts only, so other dated
// pages such as the AI disclosure must stay clean.
// Paths are relative to baseURL in playwright.config.ts.
const HERO_PHOTO_POST = '/2026/04/28/materialized-tables-in-apache-flink/';
const HERO_MD_POST = '/2024/01/03/1%EF%B8%8F%E2%83%A3%EF%B8%8F-1brc-in-sql-with-duckdb/';
const HERO_DEFAULT_IMAGE_POST = '/2016/06/20/apache-drill-conflicting-jar-problem-no-current-connection/';
const NO_HERO_POST = '/2012/09/14/advanced-monitoring-of-obiee-with-nagios/';
const LONG_TITLE_POST = '/2020/01/21/unsupportedclassversionerror-x-has-been-compiled-by-a-more-recent-version-of-the-java-runtime/';
// Shortest hero with the most wrapped meta line (3 lines on a phone), so the
// byline sits as high up the overlay's gradient as it gets: the lightest spot.
const WRAPPED_META_POST = '/2018/08/02/kafka-listeners-explained/';

const NOT_POSTS: Record<string, string> = {
  'about (no date)': '/about-me/',
  'AI disclosure (has a date)': '/ai/',
  'talks index': '/talks/',
  talk: '/talk/blog-writing-for-developers/',
  home: '/',
  category: '/categories/kafka-connect/',
  search: '/search/',
};

// Titles that break naive string concatenation into JSON or HTML.
const TRICKY_TITLES: Record<string, { path: string; expected: string }> = {
  'double quotes': { path: HERO_DEFAULT_IMAGE_POST, expected: 'No current connection' },
  emoji: { path: '/2025/05/02/the-unofficial-current-london-2025-run/walk/', expected: '🏃🚶' },
  ampersand: { path: '/2021/02/26/loading-delimited-data-into-kafka-quick-dirty-but-effective/', expected: 'quick & dirty' },
  'angle brackets in code': { path: LONG_TITLE_POST, expected: '<x>' },
  'markdown emphasis': { path: '/2023/10/02/learning-apache-flink-s01e02-what-is-flink/', expected: 'What is Flink?' },
};

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const MIN_CONTRAST = 4.5; // WCAG AA for normal-size text

const blogPosting = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent ?? ''),
  );

async function parsedBlogPosting(page: Page) {
  const scripts = await blogPosting(page);
  expect(scripts).toHaveLength(1);
  return JSON.parse(scripts[0]);
}

const byline = (page: Page) => page.locator('main a[rel="author"]');

type RGBA = [number, number, number, number];
const parseColor = (css: string): RGBA => {
  const [r, g, b, a = 1] = css.match(/[\d.]+/g)!.map(Number);
  return [r, g, b, a];
};
const over = ([r, g, b, a]: RGBA, bg: number[]) =>
  [r, g, b].map((c, i) => c * a + bg[i] * (1 - a));
const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// The colours actually painted behind the byline: hide its text, screenshot
// the box and return the lightest and darkest pixels.
async function backgroundExtremes(page: Page) {
  await page.addStyleTag({
    content: `main a[rel="author"], .post-byline { color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; }`,
  });
  const box = (await byline(page).boundingBox())!;
  const png = await page.screenshot({ clip: box, animations: 'disabled' });
  return page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const bmp = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
    let light = [0, 0, 0];
    let dark = [255, 255, 255];
    const sum = (p: number[]) => p[0] + p[1] + p[2];
    for (let i = 0; i < d.length; i += 4) {
      const p = [d[i], d[i + 1], d[i + 2]];
      if (sum(p) > sum(light)) light = p;
      if (sum(p) < sum(dark)) dark = p;
    }
    return { light, dark };
  }, png.toString('base64'));
}

async function bylineContrast(page: Page) {
  const color = parseColor(await byline(page).evaluate((el) => getComputedStyle(el).color));
  const { light, dark } = await backgroundExtremes(page);
  return Math.min(contrast(over(color, light), light), contrast(over(color, dark), dark));
}

test.describe('Post byline', () => {
  for (const [name, path, meta] of [
    ['hero photo', HERO_PHOTO_POST, '.article-hero-meta'],
    ['hero with the default image', HERO_DEFAULT_IMAGE_POST, '.article-hero-meta'],
    ['no hero', NO_HERO_POST, '.title-subtitle'],
  ]) {
    test(`${name}: names the author beside the date, linking to About`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const link = page.locator(`${meta} a[rel="author"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveText('Robin Moffatt');
      await expect(link).toHaveAttribute('href', '/about-me/');

      // Directly after the date in the same line of text, before the categories.
      const text = (await page.locator(meta).innerText()).replace(/\s+/g, ' ');
      expect(text).toMatch(/\d{2} \w{3} \d{4} by Robin Moffatt/);
    });
  }

  test('the link goes to a real page', async ({ page }) => {
    await page.goto(HERO_PHOTO_POST, { waitUntil: 'domcontentloaded' });
    await byline(page).click();
    await expect(page).toHaveURL(/\/about-me\/$/);
    await expect(page.locator('h1')).toHaveText('About Me');
  });

  for (const [name, path] of Object.entries(NOT_POSTS)) {
    test(`${name} has no byline`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await expect(byline(page)).toHaveCount(0);
    });
  }
});

test.describe('Post byline stays readable', () => {
  for (const [vpName, viewport] of [['desktop', DESKTOP], ['phone', PHONE]] as const) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test.describe(`${vpName}, ${colorScheme}`, () => {
        test.use({ viewport, colorScheme });

        test('over the brightest possible hero photo', async ({ page }) => {
          await page.goto(HERO_PHOTO_POST, { waitUntil: 'domcontentloaded' });
          // Pure white is the worst case for white text, so this holds for any photo.
          await page.addStyleTag({
            content: `.article-hero { background-image: none !important; background-color: #fff !important; }`,
          });
          expect(await bylineContrast(page)).toBeGreaterThanOrEqual(MIN_CONTRAST);
        });

        test('with no hero', async ({ page }) => {
          await page.goto(NO_HERO_POST, { waitUntil: 'domcontentloaded' });
          expect(await bylineContrast(page)).toBeGreaterThanOrEqual(MIN_CONTRAST);
        });
      });
    }
  }

  test.describe('on a phone', () => {
    test.use({ viewport: PHONE });

    for (const [name, path] of [
      ['short meta line', HERO_PHOTO_POST],
      ['long title', LONG_TITLE_POST],
      ['wrapped meta line', WRAPPED_META_POST],
      ['no hero', NO_HERO_POST],
    ]) {
      test(`${name}: fits on screen, with the name unbroken`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        const r = await byline(page).evaluate((el) => {
          const box = el.getBoundingClientRect();
          const root = document.documentElement;
          return {
            lines: el.getClientRects().length,
            left: box.left,
            right: box.right,
            viewport: root.clientWidth,
          };
        });
        expect(r.lines).toBe(1);
        expect(r.left).toBeGreaterThanOrEqual(0);
        expect(r.right).toBeLessThanOrEqual(r.viewport);
      });
    }

    test('the most wrapped meta line is still readable over a white hero', async ({ page }) => {
      await page.goto(WRAPPED_META_POST, { waitUntil: 'domcontentloaded' });
      await page.addStyleTag({
        content: `.article-hero { background-image: none !important; background-color: #fff !important; }`,
      });
      expect(await bylineContrast(page)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    });

    test('title and byline both sit inside the hero', async ({ page }) => {
      await page.goto(WRAPPED_META_POST, { waitUntil: 'domcontentloaded' });
      const r = await page.evaluate(() => {
        const rect = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        return {
          hero: rect('.article-hero'),
          h1: rect('.article-hero-content h1'),
          meta: rect('.article-hero-meta'),
        };
      });
      expect(r.h1.top).toBeGreaterThanOrEqual(r.hero.top);
      expect(r.meta.bottom).toBeLessThanOrEqual(r.hero.bottom);
    });
  });
});

test.describe('Post byline in print', () => {
  // Print is always the light palette, whatever theme the visitor chose.
  test.use({ colorScheme: 'dark' });

  for (const [name, path] of [['hero', HERO_PHOTO_POST], ['no hero', NO_HERO_POST]]) {
    test(`${name}: dark text on the white page, no URL after the name`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.emulateMedia({ media: 'print' });
      await expect(byline(page)).toBeVisible();

      const s = await byline(page).evaluate((el) => {
        const heading = document.querySelector('main h1, h1')!;
        return {
          color: getComputedStyle(el).color,
          titleColor: getComputedStyle(heading).color,
          after: getComputedStyle(el, '::after').content,
        };
      });
      const WHITE = [255, 255, 255];
      const color = parseColor(s.color);
      expect(contrast(over(color, WHITE), WHITE)).toBeGreaterThanOrEqual(MIN_CONTRAST);
      const titleColor = parseColor(s.titleColor);
      expect(contrast(over(titleColor, WHITE), WHITE)).toBeGreaterThanOrEqual(MIN_CONTRAST);
      expect(s.after).toBe('none');
    });
  }

  test('the hero photo and its dark overlay are dropped', async ({ page }) => {
    await page.goto(HERO_PHOTO_POST, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ media: 'print' });
    const s = await page.evaluate(() => ({
      image: getComputedStyle(document.querySelector('.article-hero')!).backgroundImage,
      overlay: getComputedStyle(document.querySelector('.article-hero-overlay')!).backgroundImage,
    }));
    expect(s.image).toBe('none');
    expect(s.overlay).toBe('none');
  });
});

test.describe('Post byline in print on narrow paper', () => {
  // The max-width rules for phones also match narrow paper, and come later in the CSS.
  test.use({ viewport: PHONE });

  test('keeps the compact hero', async ({ page }) => {
    await page.goto(HERO_PHOTO_POST, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ media: 'print' });
    const s = await page.evaluate(() => ({
      minHeight: getComputedStyle(document.querySelector('.article-hero')!).minHeight,
      paddingLeft: getComputedStyle(document.querySelector('.article-hero-content')!).paddingLeft,
    }));
    expect(s).toEqual({ minHeight: '0px', paddingLeft: '0px' });
  });
});

test.describe('Post metadata', () => {
  for (const [name, path] of [
    ['hero photo', HERO_PHOTO_POST],
    ['no hero', NO_HERO_POST],
  ]) {
    test(`${name}: meta author and published time`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('head meta[name="author"]')).toHaveAttribute('content', 'Robin Moffatt');

      const published = page.locator('head meta[property="article:published_time"]');
      await expect(published).toHaveCount(1);
      const value = (await published.getAttribute('content'))!;
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/);
      await expect(page.locator('main time')).toHaveAttribute('datetime', value);
    });

    test(`${name}: JSON-LD describes the post`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const data = await parsedBlogPosting(page);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      const published = await page.locator('head meta[property="article:published_time"]').getAttribute('content');

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('BlogPosting');
      expect(data.headline).toBe(await page.locator('h1').first().textContent());
      expect(data.author).toEqual({
        '@type': 'Person',
        name: 'Robin Moffatt',
        url: 'https://rmoff.net/about-me/',
      });
      expect(data.datePublished).toBe(published);
      expect(data.url).toBe(canonical);
    });
  }

  test('JSON-LD image is the post image, as a full URL that loads', async ({ page, request }) => {
    await page.goto(HERO_PHOTO_POST, { waitUntil: 'domcontentloaded' });
    const data = await parsedBlogPosting(page);
    expect(data.image).toBe(await page.locator('head meta[property="og:image"]').getAttribute('content'));
    expect(data.image).toMatch(/^https:\/\/rmoff\.net\/.+\.\w+$/);
    expect((await request.get(new URL(data.image).pathname)).status()).toBe(200);
  });

  for (const [name, path] of [
    ['hero with the default image', HERO_DEFAULT_IMAGE_POST],
    ['no hero', NO_HERO_POST],
  ]) {
    test(`${name}: JSON-LD leaves out image when the post has none`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(await parsedBlogPosting(page)).not.toHaveProperty('image');
    });
  }

  test('JSON-LD never invents a modified date', async ({ page }) => {
    // No post sets lastmod, so none has a real modified date to report.
    await page.goto(HERO_PHOTO_POST, { waitUntil: 'domcontentloaded' });
    expect(await parsedBlogPosting(page)).not.toHaveProperty('dateModified');
  });

  for (const [name, { path, expected }] of Object.entries(TRICKY_TITLES)) {
    test(`JSON-LD parses with ${name} in the title`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const [raw] = await blogPosting(page);
      expect(raw).not.toContain('<');
      const data = JSON.parse(raw);
      expect(data.headline).toContain(expected);
      expect(data.headline).toBe(await page.locator('h1').first().textContent());
      expect(data.headline).not.toMatch(/&\w+;|&#/);
    });
  }

  for (const [name, path] of Object.entries(NOT_POSTS)) {
    test(`${name} has no post metadata`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      expect(await blogPosting(page)).toEqual([]);
      await expect(page.locator('meta[name="author"]')).toHaveCount(0);
      await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);
    });
  }
});
