import { test, expect, chromium, type Page } from '@playwright/test';

// The image viewer (static/js/lightbox.js). On a phone a diagram has to open big
// enough to read, not just open. From a keyboard the whole thing has to work
// without a mouse.

// Has a 1,140px diagram that shows at about 358px on a 390px phone
const POST = '/2025/04/25/its-time-we-talked-about-time-exploring-watermarks-and-more-in-flink-sql/';
// Has an image inside a link
const LINKED_IMAGE_POST = '/2022/09/26/current-2022-5k-fun-run/';

const diagram = (page: Page) => page.locator('article.article img[src*="watermarks01"]');
const viewer = (page: Page) => page.getByRole('dialog', { name: 'Enlarged image' });
const viewerImage = (page: Page) => page.locator('.lightbox-img');
const closeButton = (page: Page) => page.getByRole('button', { name: 'Close image viewer' });

const width = (el: { evaluate: Page['evaluate'] } | any): Promise<number> =>
  el.evaluate((e: HTMLElement) => e.getBoundingClientRect().width);

// Real touch events. Input.synthesizeScrollGesture does nothing in headless Chromium,
// even on a plain page, so it can't tell a working pan from a broken one.
async function touchDrag(page: Page, from: number[][], to: number[][]) {
  const cdp = await page.context().newCDPSession(page);
  const points = (t: number) => from.map(([x, y], i) => ({
    x: x + (to[i][0] - x) * t, y: y + (to[i][1] - y) * t, id: i,
  }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(0) });
  for (let t = 0.1; t <= 1; t += 0.1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(t) });
    await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function openPost(page: Page) {
  await page.goto(POST, { waitUntil: 'load' });
  // Post images are lazy, and the viewer sets each one up once it has loaded
  await diagram(page).scrollIntoViewIfNeeded();
  await expect(diagram(page)).toHaveClass(/lightbox-zoom/);
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });

  test('tapping a diagram opens it at a readable size', async ({ page }) => {
    await openPost(page);
    const inline = await width(diagram(page));
    expect(inline).toBeLessThan(390);

    await diagram(page).tap();
    await expect(viewer(page)).toBeVisible();
    await expect(viewerImage(page)).toHaveJSProperty('complete', true);

    const natural = await viewerImage(page).evaluate((i: HTMLImageElement) => i.naturalWidth);
    expect(natural).toBe(1140);
    expect(await width(viewerImage(page))).toBeCloseTo(natural, 0);
  });

  test('a finger drag pans around the diagram, not the page behind', async ({ page }) => {
    await openPost(page);
    await diagram(page).tap();
    await expect(viewer(page)).toBeVisible();

    const scrollY = await page.evaluate(() => window.scrollY);
    await touchDrag(page, [[300, 420]], [[100, 420]]);

    await expect.poll(() => viewer(page).evaluate(d => d.scrollLeft)).toBeGreaterThan(100);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  });

  test('two fingers can pinch to zoom in further', async ({ page }) => {
    await openPost(page);
    await diagram(page).tap();
    await expect(viewer(page)).toBeVisible();

    await touchDrag(page, [[170, 420], [220, 420]], [[60, 420], [330, 420]]);
    await expect.poll(() => page.evaluate(() => window.visualViewport!.scale)).toBeGreaterThan(1.5);
  });

  test('when zoomed in by pinching, the close button stays on screen and still closes', async ({ page }) => {
    await openPost(page);
    await diagram(page).tap();
    await expect(viewer(page)).toBeVisible();

    await touchDrag(page, [[170, 420], [220, 420]], [[60, 420], [330, 420]]);
    await expect.poll(() => page.evaluate(() => window.visualViewport!.scale)).toBeGreaterThan(1.5);

    await expect.poll(() => closeButton(page).evaluate(b => {
      const r = b.getBoundingClientRect(), v = window.visualViewport!;
      return r.left >= v.offsetLeft && r.top >= v.offsetTop
        && r.right <= v.offsetLeft + v.width && r.bottom <= v.offsetTop + v.height;
    })).toBe(true);

    // Same size on the glass as when not zoomed
    const onScreen = await closeButton(page).evaluate(b =>
      b.getBoundingClientRect().width * window.visualViewport!.scale);
    expect(onScreen).toBeGreaterThanOrEqual(44);

    await closeButton(page).evaluate(b => (b as HTMLElement).click());
    await expect(page.locator('.lightbox-overlay')).toHaveCount(0);
  });

  test('tapping the diagram does not close it, and the close button does', async ({ page }) => {
    await openPost(page);
    await diagram(page).tap();
    await expect(viewer(page)).toBeVisible();

    // Stays reachable once panned away from the top left
    await viewer(page).evaluate(d => { d.scrollLeft = d.scrollWidth; });
    await viewerImage(page).tap({ position: { x: 800, y: 100 } });
    await page.waitForTimeout(300);   // longer than the fade-out, which still counts as visible
    await expect(viewer(page)).toBeVisible();

    const box = (await closeButton(page).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.y).toBeGreaterThanOrEqual(0);

    await closeButton(page).tap();
    await expect(page.locator('.lightbox-overlay')).toHaveCount(0);
  });

  test('a very large image is capped so it opens as more than a tiny fragment', async ({ page }) => {
    await openPost(page);
    await diagram(page).tap();
    await expect(viewer(page)).toBeVisible();

    await viewerImage(page).evaluate((i: HTMLImageElement) => {
      // A 3,000px wide picture, without needing a post that has one
      i.src = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="1000"/>');
      return i.decode();
    });
    expect(await width(viewerImage(page))).toBe(1600);
    const box = (await viewerImage(page).boundingBox())!;
    expect(box.height).toBeCloseTo(1600 / 3, 0);
  });

  test('a short diagram is centred vertically rather than stuck to the top', async ({ page }) => {
    await openPost(page);
    await diagram(page).tap();
    await expect(viewer(page)).toBeVisible();

    const box = (await viewerImage(page).boundingBox())!;
    expect(box.y).toBeCloseTo((844 - box.height) / 2, 0);
    expect(box.x).toBe(0);
  });
});

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('a big image still fits the screen, and clicking anywhere closes it', async ({ page }) => {
    await openPost(page);
    await diagram(page).click();
    await expect(viewer(page)).toBeVisible();

    // Swap in a picture bigger than the screen, to exercise the size limit
    await viewerImage(page).evaluate((i: HTMLImageElement) => {
      i.src = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="1000"/>');
      return i.decode();
    });
    const box = (await viewerImage(page).boundingBox())!;
    expect(box.width).toBeCloseTo(1280 * 0.9, 0);
    expect(box.height).toBeCloseTo(1280 * 0.9 / 3, 0);    // aspect ratio kept
    expect(box.x + box.width / 2).toBeCloseTo(640, 0);    // centred
    expect(box.y + box.height / 2).toBeCloseTo(400, 0);
    expect(await viewer(page).evaluate(d => d.scrollWidth > d.clientWidth)).toBe(false);

    await viewerImage(page).click();
    await expect(page.locator('.lightbox-overlay')).toHaveCount(0);

    await diagram(page).click();
    await expect(viewer(page)).toBeVisible();
    await page.mouse.click(20, 780);   // the dark area around the image
    await expect(page.locator('.lightbox-overlay')).toHaveCount(0);
  });

  test('a diagram shows on a light backing so its dark lines stay visible', async ({ page }) => {
    await openPost(page);
    await diagram(page).click();
    await expect(viewer(page)).toBeVisible();
    await expect(viewerImage(page)).toHaveCSS('background-color', 'rgb(250, 248, 245)');
  });

  test('opening an image does not shift the page behind it', async ({ baseURL }) => {
    // Headless browsers hide scrollbars by default, which would hide this problem
    const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
    const page = await browser.newPage({ baseURL, viewport: { width: 1280, height: 800 } });
    await openPost(page);
    const leftBefore = await diagram(page).evaluate(i => i.getBoundingClientRect().left);
    await diagram(page).click();
    await expect(viewer(page)).toBeVisible();
    expect(await diagram(page).evaluate(i => i.getBoundingClientRect().left)).toBe(leftBefore);
    await browser.close();
  });
});

test.describe('from the keyboard', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('an image that opens the viewer is a named, focusable button', async ({ page }) => {
    await openPost(page);
    const img = diagram(page);
    await expect(img).toHaveAttribute('tabindex', '0');
    await expect(img).toHaveRole('button');
    await expect(img).toHaveAccessibleName('Enlarge image: watermarks01.excalidraw');
    await expect(img).toHaveAttribute('aria-haspopup', 'dialog');
    // The post's own alt text is not rewritten
    await expect(img).toHaveAttribute('alt', 'watermarks01.excalidraw');
  });

  test('it can be reached with Tab', async ({ page }) => {
    await openPost(page);
    await diagram(page).evaluate(img => {
      const before = img.parentElement!.parentElement!.previousElementSibling as HTMLElement;
      before.tabIndex = -1;
      before.focus();
    });
    let reached = false;
    for (let i = 0; i < 25 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await diagram(page).evaluate(img => img === document.activeElement);
    }
    expect(reached).toBe(true);
    await expect(diagram(page)).toHaveCSS('outline-style', 'solid');
  });

  for (const [name, key] of [['Enter', 'Enter'], ['Space', ' ']]) {
    test(`${name} opens it, without scrolling the page`, async ({ page }) => {
      await openPost(page);
      await diagram(page).focus();
      const scrollY = await page.evaluate(() => window.scrollY);
      await page.keyboard.press(key);
      await expect(viewer(page)).toBeVisible();
      expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    });
  }

  test('focus goes in on open, and back to the image on Escape', async ({ page }) => {
    await openPost(page);
    await diagram(page).focus();
    await page.keyboard.press('Enter');
    await expect(closeButton(page)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('.lightbox-overlay')).toHaveCount(0);
    await expect(diagram(page)).toBeFocused();
  });

  test('the close button works from the keyboard and returns focus', async ({ page }) => {
    await openPost(page);
    await diagram(page).focus();
    await page.keyboard.press('Enter');
    await expect(closeButton(page)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('.lightbox-overlay')).toHaveCount(0);
    await expect(diagram(page)).toBeFocused();
  });

  test('Tab stays out of the page behind the viewer', async ({ page }) => {
    await openPost(page);
    await diagram(page).focus();
    await page.keyboard.press('Enter');
    await expect(closeButton(page)).toBeFocused();

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      const inPage = await page.evaluate(() => {
        const a = document.activeElement;
        return !!a && a !== document.body && !a.closest('.lightbox-overlay');
      });
      expect(inPage).toBe(false);
    }
  });

  test('the viewer can be scrolled with the arrow keys when the image is too big for the screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPost(page);
    await diagram(page).focus();
    await page.keyboard.press('Enter');
    await expect(closeButton(page)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => viewer(page).evaluate(d => d.scrollLeft)).toBeGreaterThan(0);
    await expect(closeButton(page)).toBeFocused();
  });
});

test.describe('background and leftovers', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the page behind does not scroll, and stays where it was after closing', async ({ page }) => {
    await openPost(page);
    await diagram(page).scrollIntoViewIfNeeded();
    const scrollY = await page.evaluate(() => window.scrollY);
    await diagram(page).click();
    await expect(viewer(page)).toBeVisible();

    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 800);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);

    await page.keyboard.press('Escape');
    await expect(page.locator('.lightbox-overlay')).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);

    // The page scrolls normally again
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollY);
  });

  test('an image that already fits gets no zoom behaviour, even if it needed it earlier', async ({ page }) => {
    await openPost(page);
    await expect(diagram(page)).toHaveAttribute('tabindex', '0');

    // Show it at full size, as a wide enough layout would
    await diagram(page).evaluate((i: HTMLImageElement) => {
      i.style.maxWidth = 'none';
      i.style.width = i.naturalWidth + 10 + 'px';   // the 1px border comes out of clientWidth
      window.dispatchEvent(new Event('resize'));
    });
    await expect(diagram(page)).not.toHaveClass(/lightbox-zoom/);
    await expect(diagram(page)).not.toHaveAttribute('tabindex', '0');
    await expect(diagram(page)).not.toHaveAttribute('role', 'button');
    await expect(diagram(page)).not.toHaveAttribute('aria-label', /.*/);
    await diagram(page).click();
    await expect(page.locator('.lightbox-overlay')).toHaveCount(0);
  });

  test('an image inside a link stays a plain link', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LINKED_IMAGE_POST, { waitUntil: 'load' });
    const linked = page.locator('article.article a img').first();
    await expect(linked).toBeVisible();
    await expect(linked).not.toHaveClass(/lightbox-zoom/);
    await expect(linked).not.toHaveAttribute('role', 'button');
    await expect(linked).not.toHaveAttribute('tabindex', '0');
  });
});

test('images are wired up as each one loads, without waiting for the slowest', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Hold one image back for the whole test; the rest must still work
  await page.route('**/watermarks09.excalidraw.svg', () => { /* never answered */ });
  await page.goto(POST, { waitUntil: 'domcontentloaded' });
  await diagram(page).scrollIntoViewIfNeeded();
  await expect(diagram(page)).toHaveClass(/lightbox-zoom/);
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

for (const theme of ['light', 'dark'] as const) {
  test(`close button is visible in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 1280, height: 800 });
    await openPost(page);
    await diagram(page).click();
    await expect(viewer(page)).toBeVisible();
    await expect(closeButton(page)).toBeVisible();
    await expect(closeButton(page)).toHaveCSS('color', 'rgb(255, 255, 255)');
  });
}

test('closing before the fade-in has started does not bring the viewer back', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPost(page);
  const opacities = await diagram(page).evaluate((img: HTMLImageElement) => new Promise<string>(resolve => {
    img.click();
    const dialog = document.querySelector('.lightbox-overlay') as HTMLElement;
    (document.querySelector('.lightbox-close') as HTMLElement).click();
    // Two frames, so the fade-in callback has had its chance to run
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(dialog.style.opacity)));
  }));
  expect(opacities).toBe('0');
  await expect(page.locator('.lightbox-overlay')).toHaveCount(0);
});

test('with reduced motion, the close is instant and focus returns at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPost(page);
  await diagram(page).focus();
  await page.keyboard.press('Enter');
  await expect(closeButton(page)).toBeFocused();
  await expect(viewer(page)).toHaveCSS('transition-duration', '0s');

  const result = await page.evaluate(() => {
    (document.querySelector('.lightbox-close') as HTMLElement).click();
    return {
      gone: document.querySelector('.lightbox-overlay') === null,
      focused: document.activeElement!.getAttribute('src'),
    };
  });
  expect(result.gone).toBe(true);
  expect(result.focused).toContain('watermarks01');
});
