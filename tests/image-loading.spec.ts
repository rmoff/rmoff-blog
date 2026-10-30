import { test, expect, Page } from '@playwright/test';

// Post images load lazily, keep their space before they load, and nothing that
// relied on every image being downloaded up front stops working.
const ASCIIDOC_POST = '/2026/04/28/materialized-tables-in-apache-flink/';
const MARKDOWN_POST = '/2018/08/02/kafka-listeners-explained/';
const LONG_POST = '/2025/03/20/building-a-data-pipeline-with-duckdb/';

const postImages = 'article.article img:not([data-pagefind-meta])';

// Hold every local image back for `ms`, so that images are still arriving after the
// reader has jumped. On localhost they would otherwise all land within a few ms and
// hide the problem these tests look for.
async function slowImages(page: Page, ms: number) {
  await page.route(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i, async route => {
    await new Promise(r => setTimeout(r, ms));
    await route.continue().catch(() => {});
  });
}

// The TOC heading with the most images above it, as far down the page as possible
// while still leaving room to scroll it to the top of the viewport.
async function findLateHeading(page: Page): Promise<string> {
  return page.evaluate(() => {
    const links = [...document.querySelectorAll('.docs-toc a[href^="#"]')] as HTMLAnchorElement[];
    const ids = links.map(a => a.getAttribute('href')!.slice(1)).filter(Boolean);
    const all = [...document.querySelectorAll('article.article img')];
    const scored = ids.map(id => {
      const h = document.getElementById(id);
      if (!h) return { id, above: -1 };
      const above = all.filter(i => h.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_PRECEDING).length;
      return { id, above };
    });
    return scored.sort((a, b) => b.above - a.above)[0].id;
  });
}

// The heading's distance from the top of the viewport once nothing is moving any more.
// It must stay still for a full second, so a late image can't slip past the check.
async function settledTop(page: Page, id: string): Promise<number> {
  return page.evaluate(async id => {
    const el = document.getElementById(id)!;
    const top = () => el.getBoundingClientRect().top;
    let last = top();
    let stillFor = 0;
    for (let waited = 0; waited < 15000 && stillFor < 1000; waited += 100) {
      await new Promise(r => setTimeout(r, 100));
      const now = top();
      stillFor = Math.abs(now - last) < 1 ? stillFor + 100 : 0;
      last = now;
    }
    return last;
  }, id);
}

test.describe('Post images load as the reader reaches them', () => {
  for (const [kind, url] of [['AsciiDoc', ASCIIDOC_POST], ['Markdown', MARKDOWN_POST]]) {
    test(`every image in a ${kind} post is lazy and decodes off the main thread`, async ({ page }) => {
      await page.goto(url);
      const images = page.locator(postImages);
      const total = await images.count();
      expect(total).toBeGreaterThan(0);
      await expect(page.locator(`${postImages}[loading="lazy"][decoding="async"]`)).toHaveCount(total);
    });

    test(`every local image in a ${kind} post has its size set`, async ({ page }) => {
      await page.goto(url);
      const unsized = await page.locator(postImages).evaluateAll(imgs =>
        imgs.filter(i => {
          const local = new URL((i as HTMLImageElement).src).origin === location.origin;
          return local && !(i.hasAttribute('width') && i.hasAttribute('height'));
        }).map(i => i.getAttribute('src')));
      expect(unsized).toEqual([]);
    });
  }

  test('images far down the page are not downloaded before scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requested: string[] = [];
    page.on('request', r => requested.push(r.url()));
    await page.goto(ASCIIDOC_POST);
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);
    expect(requested.filter(u => u.endsWith('thor-really.gif'))).toEqual([]);
    expect(requested.filter(u => u.includes('tenor.com'))).toEqual([]);
  });

  test('a far-down image still loads when the reader scrolls to it', async ({ page }) => {
    await page.goto(ASCIIDOC_POST);
    const gif = page.locator(`${postImages}[src$="thor-really.gif"]`);
    await gif.scrollIntoViewIfNeeded();
    await expect.poll(() => gif.evaluate(i => (i as HTMLImageElement).naturalWidth), { timeout: 10000 }).toBeGreaterThan(0);
  });
});

test.describe('Images keep their space before they load', () => {
  test('a local image is the right shape before it has loaded', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // Never answer, so the measurement can only come from the markup
    await page.route(/\/images\/.*\.(png|webp|gif|svg)$/, () => {});
    await page.goto(LONG_POST, { waitUntil: 'domcontentloaded' });
    const flat = await page.locator(postImages).evaluateAll(imgs =>
      imgs.filter(i => {
        const local = new URL((i as HTMLImageElement).src).origin === location.origin;
        return local && (i as HTMLElement).offsetHeight < 20;
      }).map(i => i.getAttribute('src')));
    expect(flat).toEqual([]);
  });

  test('a sized image stays in proportion when squeezed onto a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ASCIIDOC_POST);
    const first = page.locator(postImages).first();
    await first.scrollIntoViewIfNeeded();
    await expect.poll(() => first.evaluate(i => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const { shown, natural } = await first.evaluate(i => {
      const img = i as HTMLImageElement;
      return { shown: img.clientWidth / img.clientHeight, natural: img.naturalWidth / img.naturalHeight };
    });
    expect(Math.abs(shown - natural)).toBeLessThan(0.05);
  });

  test('scrolling through a long post causes almost no layout shift', async ({ page }) => {
    await slowImages(page, 300);
    await page.addInitScript(() => {
      (window as any).__cls = 0;
      new PerformanceObserver(list => {
        for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) (window as any).__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LONG_POST);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 600) {
      await page.evaluate(top => window.scrollTo(0, top), y);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(1000);
    const cls = await page.evaluate(() => (window as any).__cls);
    expect(cls).toBeLessThan(0.1);
  });
});

// Chromium and Firefox have scroll anchoring, which hides most of this problem by keeping
// the reader's place when content above grows. Not every browser has it, so these run
// with it on and off. Off, only the space kept for each image holds the heading still.
for (const anchoring of [true, false]) {
  const label = anchoring ? 'with scroll anchoring' : 'without scroll anchoring';
  const setAnchoring = (page: Page) => anchoring ? Promise.resolve() : page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.overflowAnchor = 'none';
      document.body.style.overflowAnchor = 'none';
    });
  });
  const expectedTop = (page: Page, id: string) => page.evaluate(
    id => parseFloat(getComputedStyle(document.getElementById(id)!).scrollMarginTop) || 0, id);

  test.describe(`Table of contents links land on their heading ${label}`, () => {
    test('clicking a link far down the page, while images are still arriving', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await setAnchoring(page);
      await slowImages(page, 800);
      // After load: until then Chromium keeps re-scrolling to the target itself
      await page.goto(LONG_POST, { waitUntil: 'load' });
      const id = await findLateHeading(page);
      await page.locator(`.docs-toc a[href="#${id}"]`).click();
      const top = await settledTop(page, id);
      expect(Math.abs(top - await expectedTop(page, id))).toBeLessThan(10);
    });

    test('opening a link straight to a heading', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(LONG_POST);
      const id = await findLateHeading(page);

      await setAnchoring(page);
      await slowImages(page, 800);
      await page.goto('about:blank');
      await page.goto(`${LONG_POST}#${id}`, { waitUntil: 'domcontentloaded' });
      const top = await settledTop(page, id);
      expect(Math.abs(top - await expectedTop(page, id))).toBeLessThan(10);
    });
  });
}

test.describe('Printing a post', () => {
  const unloaded = (page: Page) => page.locator(postImages).evaluateAll(imgs =>
    imgs.filter(i => (i as HTMLImageElement).naturalWidth === 0).length);

  // Headless Chromium has no print dialog, so record what the page looked like when
  // it asked for one
  async function recordPrint(page: Page) {
    await page.addInitScript(() => {
      (window as any).__printed = [];
      window.print = () => {
        const imgs = [...document.querySelectorAll('article.article img:not([data-pagefind-meta])')] as HTMLImageElement[];
        (window as any).__printed.push(imgs.filter(i => i.naturalWidth === 0).length);
      };
    });
  }

  test('Ctrl+P waits for images the reader never scrolled to', async ({ page }) => {
    await recordPrint(page);
    await slowImages(page, 300);
    await page.goto(LONG_POST);
    expect(await unloaded(page)).toBeGreaterThan(0);
    await page.keyboard.press('Control+p');
    await expect.poll(() => page.evaluate(() => (window as any).__printed), { timeout: 15000 }).toEqual([0]);
  });

  test('pressing Ctrl+P twice while waiting prints once', async ({ page }) => {
    await recordPrint(page);
    await slowImages(page, 800);
    await page.goto(LONG_POST);
    await page.keyboard.press('Control+p');
    await page.keyboard.press('Control+p');
    await expect.poll(() => page.evaluate(() => (window as any).__printed), { timeout: 15000 }).toEqual([0]);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => (window as any).__printed)).toEqual([0]);
  });

  test('Ctrl+P still waits after a print from a menu was cancelled', async ({ page }) => {
    await recordPrint(page);
    await slowImages(page, 800);
    await page.goto(LONG_POST);
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await page.keyboard.press('Control+p');
    await expect.poll(() => page.evaluate(() => (window as any).__printed), { timeout: 15000 }).toEqual([0]);
  });

  test('printing from a menu starts the remaining downloads', async ({ page }) => {
    await page.goto(LONG_POST);
    expect(await unloaded(page)).toBeGreaterThan(0);
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await expect.poll(() => unloaded(page), { timeout: 15000 }).toBe(0);
  });
});

test.describe('Lightbox', () => {
  test('opens on an image that loaded only after scrolling to it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ASCIIDOC_POST);
    const img = page.locator(postImages).last();
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveClass(/lightbox-zoom/, { timeout: 15000 });
    await img.click();
    const overlay = page.locator('.lightbox-img');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('src', (await img.getAttribute('src'))!);
  });
});

test.describe('Header photo', () => {
  const heroUrl = (page: Page) => page.locator('.article-hero').evaluate(el => getComputedStyle(el).backgroundImage);

  test('a phone downloads a smaller copy and never the full-size photo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const images: string[] = [];
    page.on('request', r => { if (r.resourceType() === 'image') images.push(r.url()); });
    await page.goto(ASCIIDOC_POST);
    await page.waitForLoadState('load');
    expect(await heroUrl(page)).not.toContain('h_IMG_5286.webp');
    expect(images.some(u => u.includes('h_IMG_5286') && u.endsWith('.webp') && !u.endsWith('/h_IMG_5286.webp'))).toBe(true);
    expect(images.filter(u => u.endsWith('/h_IMG_5286.webp'))).toEqual([]);
  });

  test('a desktop gets the full-size photo', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(ASCIIDOC_POST);
    expect(await heroUrl(page)).toContain('h_IMG_5286.webp');
  });

  test('a photo with no smaller copy still shows on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/2026/05/06/ai-slop-is-killing-online-communities/');
    expect(await heroUrl(page)).toContain('h_IMG_1675.webp');
  });
});
