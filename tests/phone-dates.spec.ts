import { test, expect, type Page } from '@playwright/test';

// Post lists must show each post's date on phones, so a reader can tell what's
// new and whether a version-sensitive post is still current. Category labels
// may stay hidden at these widths; the date may not.
// Paths are relative to baseURL in playwright.config.ts.

const lists = [
  { name: 'home page', url: '/' },
  { name: 'category page', url: '/categories/apache-flink/' },
  { name: 'Interesting Links page', url: '/categories/interesting-links/' },
];

const phoneWidths = [320, 390];
const schemes = ['light', 'dark'] as const;

// Everything the tests need about every row on the page. Older years start
// collapsed, so open them all first: a reader can, and it keeps the measurements
// meaningful for all posts rather than only the current year's.
const measureRows = (page: Page) =>
  page.evaluate(async () => {
    document.querySelectorAll('details.year-group').forEach((d) => d.setAttribute('open', ''));
    await document.fonts.ready;

    type Rgba = [number, number, number, number];
    const parse = (c: string): Rgba => {
      const [r, g, b, a = 1] = (c.match(/[\d.]+/g) ?? []).map(Number);
      return [r, g, b, a];
    };
    // Paint a colour, at its own alpha, over an opaque one.
    const over = ([r, g, b, a]: Rgba, [ur, ug, ub]: Rgba): Rgba => [
      r * a + ur * (1 - a),
      g * a + ug * (1 - a),
      b * a + ub * (1 - a),
      1,
    ];
    const selfAndAncestors = (el: Element) => {
      const chain: Element[] = [];
      for (let e: Element | null = el; e; e = e.parentElement) chain.push(e);
      return chain;
    };
    // What is really behind an element: every ancestor's background, page first.
    const backdrop = (el: Element) =>
      selfAndAncestors(el)
        .reverse()
        .reduce<Rgba>((under, e) => over(parse(getComputedStyle(e).backgroundColor), under), [255, 255, 255, 1]);
    const opacity = (el: Element) =>
      selfAndAncestors(el).reduce((o, e) => o * parseFloat(getComputedStyle(e).opacity), 1);
    const luminance = ([r, g, b]: Rgba) => {
      const [lr, lg, lb] = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    };
    // Contrast of the text as it is painted, so transparency counts against it.
    const contrast = (el: Element) => {
      const bg = backdrop(el);
      const [r, g, b, a] = parse(getComputedStyle(el).color);
      const text = over([r, g, b, a * opacity(el)], bg);
      const [hi, lo] = [luminance(text), luminance(bg)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    const rows = [...document.querySelectorAll<HTMLElement>('.post-row')];
    return {
      viewport: window.innerWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      rows: rows.map((row) => {
        const date = row.querySelector<HTMLElement>('.post-date');
        const title = row.querySelector<HTMLElement>('.post-title-link');
        const titleBox = title?.getBoundingClientRect();
        const style = date ? getComputedStyle(date) : null;
        // Measure the text itself: the element's box can't tell one line from two.
        const text = document.createRange();
        if (date) text.selectNodeContents(date);
        const textBox = text.getBoundingClientRect();
        return {
          title: title?.textContent?.trim() ?? '',
          dateText: date?.textContent?.trim() ?? '',
          dateDisplay: style?.display ?? 'missing',
          dateVisibility: style?.visibility ?? 'missing',
          dateLines: new Set([...text.getClientRects()].map((r) => Math.round(r.top))).size,
          dateClipped: date ? date.scrollWidth > date.clientWidth : false,
          dateBottom: textBox.bottom,
          dateLeft: textBox.left,
          dateRight: textBox.right,
          dateFontPx: style ? parseFloat(style.fontSize) : 0,
          dateContrast: date ? contrast(date) : 0,
          titleTop: titleBox?.top ?? 0,
          titleWidth: titleBox?.width ?? 0,
        };
      }),
    };
  });

for (const list of lists) {
  for (const width of phoneWidths) {
    for (const colorScheme of schemes) {
      test.describe(`${list.name} at ${width}px, ${colorScheme}`, () => {
        test.use({ viewport: { width, height: 844 }, colorScheme });

        test('every row shows a compact, readable date', async ({ page }) => {
          await page.goto(list.url);
          const { rows, viewport, docScrollWidth } = await measureRows(page);

          expect(rows.length, 'no post rows found').toBeGreaterThan(0);
          for (const row of rows) {
            const label = `"${row.title}"`;
            expect(row.dateDisplay, `${label}: date is hidden`).not.toBe('none');
            expect(row.dateVisibility, `${label}: date is invisible`).toBe('visible');
            expect(row.dateText, `${label}: date text`).toMatch(/^\d{2} [A-Z][a-z]{2} \d{4}$/);
            expect(row.dateLines, `${label}: date should be on one line`).toBe(1);
            expect(row.dateClipped, `${label}: date is cut off`).toBe(false);
            expect(row.dateFontPx, `${label}: date text too small`).toBeGreaterThanOrEqual(11);
            expect(row.dateContrast, `${label}: date contrast`).toBeGreaterThanOrEqual(4.5);
            expect(row.dateLeft, `${label}: date off the left edge`).toBeGreaterThanOrEqual(0);
            expect(row.dateRight, `${label}: date off the right edge`).toBeLessThanOrEqual(viewport);
            expect(row.dateBottom, `${label}: date overlaps the title`).toBeLessThanOrEqual(row.titleTop + 1);
            expect(row.titleWidth, `${label}: title squeezed`).toBeGreaterThanOrEqual(width * 0.45);
          }
          expect(docScrollWidth, 'page scrolls sideways').toBeLessThanOrEqual(viewport);
        });
      });
    }
  }
}

test.describe('desktop post rows', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('still show both the date and the category label', async ({ page }) => {
    await page.goto('/');
    const row = page.locator('.post-row').first();
    await expect(row.locator('.post-date')).toBeVisible();
    await expect(row.locator('.post-category')).toBeVisible();
  });
});
