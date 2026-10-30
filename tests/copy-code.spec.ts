import { test, expect, Locator, Page } from '@playwright/test';

// The copy button on code blocks, in both post formats. Paths are relative to
// baseURL in playwright.config.ts.
const MD_POST = '/2018/08/02/kafka-listeners-explained/'; // plain <pre><code>, 14 blocks
const MD_CHROMA_POST = '/2022/09/16/data-engineering-in-2022-exploring-lakefs-with-jupyter-and-pyspark/';
const ADOC_POST = '/2026/03/13/evaluating-claudes-dbt-skills-building-an-eval-from-scratch/';
const ADOC_CALLOUT_POST = '/2026/03/11/claude-code-isnt-going-to-replace-data-engineers-yet/';
const ADOC_RESULTS_POST = '/2026/02/19/ten-years-late-to-the-dbt-party-duckdb-edition/';
const MD_LINENOS_POST = '/2020/06/25/learning-golang-some-rough-notes-s01e02-slices/';
const ADOC_LINENOS_POST = '/2024/12/11/disabling-vale-linting-selectively-in-asciidoc/';

const COPY = 'button[aria-label="Copy code"]';
const STATUS = '.copy-status[role="status"]';

// Tab forward from the top of the page until a copy button has focus: the real
// keyboard route, rather than calling focus() on it.
async function tabToCopyButton(page: Page) {
  for (let i = 0; i < 150; i++) {
    await page.keyboard.press('Tab');
    const onButton = await page.evaluate(() => document.activeElement?.matches('.copy-button'));
    if (onButton) return;
  }
  throw new Error('Tab never reached a copy button');
}

// Top edge of the first character of code in a block.
const firstTextTop = (pre: Locator) =>
  pre.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && !node.textContent!.trim()) node = walker.nextNode();
    const range = document.createRange();
    range.setStart(node!, 0);
    range.setEnd(node!, 1);
    return range.getBoundingClientRect().top;
  });

test.describe('Every code block has a copy button', () => {
  for (const [name, url] of [
    ['plain Markdown', MD_POST],
    ['highlighted Markdown', MD_CHROMA_POST],
    ['AsciiDoc', ADOC_POST],
  ]) {
    test(`${name} post`, async ({ page }) => {
      await page.goto(url);
      const blocks = await page.locator('pre:not(pre pre, :has(.lnt))').count();
      expect(blocks).toBeGreaterThan(0);
      await expect(page.locator(COPY)).toHaveCount(blocks);
    });
  }

  test('session transcript rows do not get one', async ({ page }) => {
    await page.goto(ADOC_CALLOUT_POST);
    await expect(page.locator(COPY).first()).toBeAttached();
    await expect(page.locator(`[class*="ev-"] ${COPY}`)).toHaveCount(0);
  });

  test('line numbers do not get a button of their own', async ({ page }) => {
    await page.goto(MD_LINENOS_POST);
    const tables = page.locator('.lntable');
    expect(await tables.count()).toBeGreaterThan(0);
    const perTable = await tables.evaluateAll((els) => els.map((el) => el.querySelectorAll('.copy-button').length));
    expect(new Set(perTable)).toEqual(new Set([1]));
    await expect(page.locator(`td:has(.lnt) ${COPY}`)).toHaveCount(0);

    await page.goto(ADOC_LINENOS_POST);
    await expect(page.locator('.code-block:has(.linenotable)').first()).toBeAttached();
    await expect(page.locator(`.linenotable ${COPY}`)).toHaveCount(0);
  });

  test('inline code does not get one', async ({ page }) => {
    await page.goto(MD_POST);
    const inline = page.locator('p code').first();
    await expect(inline).toBeVisible();
    await expect(page.locator(`p ${COPY}`)).toHaveCount(0);
  });

  test('the Markdown post named in the UX review has all 14', async ({ page }) => {
    await page.goto(MD_POST);
    await expect(page.locator(COPY)).toHaveCount(14);
  });
});

test.describe('Copying', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('keyboard: Tab shows the button, Enter copies a Markdown block and announces it', async ({ page }) => {
    await page.goto(MD_POST);
    await tabToCopyButton(page);

    const button = page.locator('.copy-button:focus');
    await expect(button).toHaveAttribute('aria-label', 'Copy code');
    await expect(button).toHaveCSS('opacity', '1');

    await page.keyboard.press('Enter');
    await expect(page.locator(STATUS)).toHaveText('Copied');

    const expected = await button.evaluate((el) => el.parentElement!.querySelector('pre')!.textContent!);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(expected.replace(/\n+$/, ''));
    expect(copied).toContain('KAFKA_LISTENERS: LISTENER_BOB://kafka0:29092');
  });

  test('keyboard: Space copies an AsciiDoc block', async ({ page }) => {
    await page.goto(ADOC_POST);
    await tabToCopyButton(page);
    const button = page.locator('.copy-button:focus');
    await expect(button).toHaveCSS('opacity', '1');

    await page.keyboard.press('Space');
    await expect(page.locator(STATUS)).toHaveText('Copied');

    const expected = await button.evaluate((el) => el.parentElement!.querySelector('code')!.textContent!);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  });

  test('highlighted Markdown keeps its line breaks and loses the final newline', async ({ page }) => {
    await page.goto(MD_CHROMA_POST);
    const block = page.locator('.code-block', { has: page.locator('pre.chroma') }).first();
    await block.hover();
    await block.locator('.copy-button').click();
    await expect(page.locator(STATUS)).toHaveText('Copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe((await block.locator('code').textContent())!.replace(/\n+$/, ''));
    expect(copied.endsWith('\n')).toBe(false);
  });

  test('AsciiDoc callout numbers stay out of the copied text', async ({ page }) => {
    await page.goto(ADOC_CALLOUT_POST);
    const block = page.locator('.code-block', { has: page.locator('.conum') }).first();
    await block.hover();
    await block.locator('.copy-button').click();
    await expect(page.locator(STATUS)).toHaveText('Copied');

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Data exploration: https://rmoff.net/2025/02/28/');
    expect(copied).not.toMatch(/\(\d+\)\s*$/m);
    // The space in front of the marker goes too, so no line ends in a stray space.
    expect(copied).not.toMatch(/[ \t]+$/m);
    await expect(block.locator('.conum').first()).toBeVisible();
  });

  test('line numbers stay out of the copied text', async ({ page }) => {
    await page.goto(ADOC_LINENOS_POST);
    const block = page.locator('.code-block:has(.lineno)').first();
    await block.hover();
    await block.locator('.copy-button').click();
    await expect(page.locator(STATUS)).toHaveText('Copied');
    const expected = (await block.locator('td.code').textContent())!.replace(/\n+$/, '');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);

    await page.goto(MD_LINENOS_POST);
    const chroma = page.locator('.lntable .code-block').first();
    await chroma.hover();
    await chroma.locator('.copy-button').click();
    await expect(page.locator(STATUS)).toHaveText('Copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe((await chroma.locator('code').textContent())!.replace(/\n+$/, ''));
  });

  test('angle brackets in code survive the copy', async ({ page }) => {
    await page.goto(ADOC_CALLOUT_POST);
    const block = page.locator('.code-block:has(.conum)').first();
    await block.evaluate((el) => {
      // A highlighter token whose text looks like an HTML tag.
      const span = document.createElement('span');
      span.textContent = '"<b>bold</b>"';
      el.querySelector('code')!.prepend(span);
    });
    await block.hover();
    await block.locator('.copy-button').click();
    await expect(page.locator(STATUS)).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('"<b>bold</b>"');
  });

  test('the button says it worked, then goes back to normal', async ({ page }) => {
    await page.goto(MD_POST);
    const block = page.locator('.code-block').first();
    await block.hover();
    const button = block.locator('.copy-button');
    await button.click();
    await expect(button).toHaveClass(/is-copied/);
    await expect(button).toHaveClass(/copy-button$/, { timeout: 4000 });
    await expect(page.locator(STATUS)).toBeEmpty();
    await expect(button).toHaveAttribute('aria-label', 'Copy code');
  });
});

test.describe('When the clipboard refuses', () => {
  const pageErrors = (page: Page) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    return errors;
  };

  test('a rejected write is shown and announced, with no uncaught error', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.clipboard.writeText = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
    });
    const errors = pageErrors(page);
    await page.goto(MD_POST);
    await tabToCopyButton(page);
    await page.keyboard.press('Enter');

    await expect(page.locator(STATUS)).toContainText('Copy failed');
    const button = page.locator('.copy-button:focus');
    await expect(button).toHaveClass(/is-failed/);
    await expect(button).toContainText('Copy failed');
    await expect(button).not.toHaveClass(/is-copied/);
    expect(errors).toEqual([]);
  });

  test('a browser with no clipboard API gets the same message', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined });
    });
    const errors = pageErrors(page);
    await page.goto(MD_POST);
    await tabToCopyButton(page);
    await page.keyboard.press('Enter');
    await expect(page.locator(STATUS)).toContainText('Copy failed');
    expect(errors).toEqual([]);
  });
});

test.describe('Mouse', () => {
  test('the button stays out of the way until the block is hovered', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(MD_POST);
    const block = page.locator('.code-block').first();
    const button = block.locator('.copy-button');
    await page.mouse.move(0, 0);
    await expect(button).toHaveCSS('opacity', '0');
    await block.hover();
    await expect(button).toHaveCSS('opacity', '1');
  });
});

test.describe('Touch screens', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const [name, url] of [['Markdown', MD_POST], ['AsciiDoc', ADOC_POST]]) {
    test(`${name}: visible with no hover, and no sideways page scroll`, async ({ page }) => {
      await page.goto(url);
      const button = page.locator(COPY).first();
      await expect(button).toBeVisible();
      await expect(button).toHaveCSS('opacity', '1');

      // At this width the site sets overflow-x: hidden, so scrollWidth proves
      // nothing: check the edges of what was added instead.
      const width = await page.evaluate(() => document.documentElement.clientWidth);
      const edges = await page.locator('.code-block, .copy-button').evaluateAll((els) =>
        els.map((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right }; }),
      );
      expect(edges.length).toBeGreaterThan(0);
      for (const edge of edges) {
        expect(edge.left).toBeGreaterThanOrEqual(0);
        expect(edge.right).toBeLessThanOrEqual(width);
      }
    });
  }

  test('the tap target is at least 44px each way', async ({ page }) => {
    await page.goto(MD_POST);
    const button = page.locator(COPY).first();
    await button.scrollIntoViewIfNeeded();
    const box = (await button.boundingBox())!;
    const hits = await page.evaluate(({ x, y, w, h }) => {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const points = [[cx - 21, cy], [cx + 21, cy], [cx, cy - 21], [cx, cy + 21]];
      return points.map(([px, py]) => document.elementFromPoint(px, py)?.closest('.copy-button') != null);
    }, { x: box.x, y: box.y, w: box.width, h: box.height });
    expect(hits).toEqual([true, true, true, true]);
  });
});

test.describe('The button never covers code', () => {
  for (const [name, url, width] of [
    ['Markdown, desktop', MD_POST, 1280],
    ['Markdown, phone', MD_POST, 390],
    ['AsciiDoc, desktop', ADOC_POST, 1280],
    ['AsciiDoc, phone', ADOC_POST, 390],
    // Query results sit flush under the query, with tighter padding of their own.
    ['AsciiDoc query results', ADOC_RESULTS_POST, 1280],
  ] as const) {
    test(`${name}, even with the code scrolled sideways`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      const total = await page.locator('.code-block').count();
      expect(total).toBeGreaterThan(0);

      for (let i = 0; i < total; i++) {
        const block = page.locator('.code-block').nth(i);
        const button = block.locator('.copy-button');
        const pre = block.locator('pre').first();
        await block.scrollIntoViewIfNeeded();

        const before = (await button.boundingBox())!;
        const box = (await pre.boundingBox())!;
        const textTop = await firstTextTop(pre);
        expect(before.y + before.height, `block ${i}: button overlaps the first line`).toBeLessThanOrEqual(textTop);
        expect(before.x + before.width, `block ${i}: button sticks out`).toBeLessThanOrEqual(box.x + box.width);
        expect(before.y, `block ${i}: button above the block`).toBeGreaterThanOrEqual(box.y);

        // Stays in the corner while the code scrolls underneath the band.
        await pre.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
        const after = (await button.boundingBox())!;
        expect(after.x, `block ${i}: button moved with the code`).toBe(before.x);
      }
    });
  }
});

test.describe('Dark mode and print', () => {
  test.describe('dark', () => {
    test.use({ colorScheme: 'dark' });

    test('the button uses the dark palette and still appears on focus', async ({ page }) => {
      await page.goto(MD_POST);
      await tabToCopyButton(page);
      const button = page.locator('.copy-button:focus');
      await expect(button).toHaveCSS('opacity', '1');
      await expect(button).toHaveCSS('background-color', 'rgb(28, 25, 23)'); // #1C1917
    });
  });

  test('hidden in print, and the space kept for it goes too', async ({ page }) => {
    await page.goto(MD_POST);
    const pre = page.locator('.code-block pre').first();
    const screenPadding = await pre.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator(COPY).first()).toBeHidden();
    const printPadding = await pre.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(printPadding).toBeLessThan(screenPadding);
  });
});
