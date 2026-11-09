import { test, expect, Page } from '@playwright/test';

// Footer lemmings (layouts/partials/lemmings-footer.html): two drop in when the footer nears the view.
const ARTICLE_URL = '/2026/01/14/alternatives-to-minio-for-single-node-local-s3/';

const walkers = (page: Page) => page.evaluate(() =>
  [...(document.getElementById('lemmings')?.shadowRoot?.querySelectorAll<HTMLElement>('.wrap:not(.gone)') ?? [])]
    .map(w => {
      const r = w.querySelector('i')!.getBoundingClientRect();
      return { state: w.dataset.state, top: r.top + scrollY, bottom: r.bottom + scrollY, x: r.left + r.width / 2 };
    }));

const footerTop = (page: Page) => page.locator('.site-footer').evaluate(f => f.getBoundingClientRect().top + scrollY);
const add = (page: Page, at: { x: number, y: number }) => page.evaluate(a => (window as any).lemmings.add(a), at);

// Scroll down to the footer and wait for the two lemmings that start there. Lazy images above can push the
// footer down after the jump, leaving it (and its paused lemmings) off-screen, so keep bringing it back into view
// as a reader would, until the page stops growing.
async function toFooter(page: Page) {
  await page.goto(ARTICLE_URL);
  let h = 0;
  for (let i = 0; i < 10; i++) {
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const now = await page.evaluate(() => document.documentElement.scrollHeight);
    if (now === h) break;
    h = now;
  }
  await expect.poll(async () => (await walkers(page)).length).toBe(2);
}

// Drop a lemming (at() gives where) and tap it while it falls until its umbrella opens. It is a fast-moving target,
// so under load a tap can miss before it lands; then drop another and try again.
async function dropAndOpenUmbrella(page: Page, at: () => Promise<{ x: number, y: number }>) {
  const floating = () => page.evaluate(() => !!document.getElementById('lemmings')!.shadowRoot!.querySelector('.sprite.floater'));
  for (let attempt = 0; attempt < 3 && !(await floating()); attempt++) {
    await add(page, await at());
    for (let i = 0; i < 40 && !(await floating()); i++) {
      const box = await page.evaluate(() => {
        const w = [...document.getElementById('lemmings')!.shadowRoot!.querySelectorAll<HTMLElement>('.wrap')].at(-1)!;
        const r = w.querySelector('i')!.getBoundingClientRect();
        return w.dataset.state === 'air' && r.top > 0 && r.bottom < innerHeight ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
      });
      if (!box) break;   // it landed: drop another
      await page.mouse.click(box.x, box.y);
      await page.waitForTimeout(160);   // the umbrella shows on the next step; a second tap now would close it
    }
  }
  expect(await floating()).toBe(true);
}

// Press on a walking lemming and start dragging it; walkers move, so check it is really held, and retry if not.
// Returns the page-space point it was picked up at. The mouse button is left down.
async function pickUp(page: Page, which = 0) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const p = await page.evaluate(n => {
      const w = [...document.getElementById('lemmings')!.shadowRoot!.querySelectorAll<HTMLElement>('.wrap')]
        .filter(x => x.dataset.state === 'walk')[n];
      if (!w) return null;
      const r = w.querySelector('i')!.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, which);
    if (p) {
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.mouse.move(p.x, p.y - 12, { steps: 2 });
      const held = await page.evaluate(() =>
        [...document.getElementById('lemmings')!.shadowRoot!.querySelectorAll<HTMLElement>('.wrap')].some(x => x.dataset.state === 'held'));
      if (held) return { x: p.x, y: p.y - 12 };
      await page.mouse.up();
    }
    await page.waitForTimeout(200);
  }
  throw new Error('could not pick up a lemming');
}

test.describe('footer lemmings', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('nothing loads at the top of a post; two lemmings and the door appear near the footer', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', r => requests.push(r.url()));
    await page.goto(ARTICLE_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);
    expect(requests.some(u => u.includes('/js/lemmings.'))).toBe(false);
    expect(await page.evaluate(() => 'lemmings' in window)).toBe(false);
    await expect(page.locator('.lemming-door')).toBeHidden();
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await expect.poll(async () => (await walkers(page)).length).toBe(2);
    await expect(page.locator('.lemming-door')).toBeVisible();
  });

  test('the footer has no lemming button, icon or count', async ({ page }) => {
    await toFooter(page);
    await expect(page.locator('.site-footer button')).toHaveCount(0);
    await expect(page.locator('.site-footer')).not.toContainText('home');
  });

  test('they land on the footer rule and stay there when the reader scrolls up', async ({ page }) => {
    await toFooter(page);
    // with the footer in view (late images can push it down), every lemming still out (one may have reached the
    // door) is walking on the footer rule
    await expect.poll(async () => {
      await page.locator('.site-footer').scrollIntoViewIfNeeded();
      const top = await footerTop(page), ws = await walkers(page);
      return ws.length > 0 && ws.every(w => w.state === 'walk' && Math.abs(w.bottom - top) < 12);
    }, { timeout: 15000 }).toBe(true);
    const top = await footerTop(page);
    await page.evaluate(() => scrollBy(0, -800));
    await page.waitForTimeout(1500);
    for (const w of await walkers(page)) expect(w.bottom).toBeGreaterThan(top - 12);
  });

  test('when the page above grows right after a lemming lands, it moves down with the footer', async ({ page }) => {
    await toFooter(page);
    const top = await footerTop(page);
    await add(page, { x: 400, y: top - 4 });
    // the moment it lands, push the footer 400px down (as a late image would)
    await page.waitForFunction(() =>
      [...document.getElementById('lemmings')!.shadowRoot!.querySelectorAll<HTMLElement>('.wrap')].at(-1)!.dataset.state === 'walk',
      null, { polling: 'raf' });
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '400px';
      document.querySelector('.site-footer')!.before(spacer);
    });
    await expect.poll(async () => {
      await page.locator('.site-footer').scrollIntoViewIfNeeded();
      const t = await footerTop(page), ws = await walkers(page);
      return ws.length > 0 && ws.every(w => w.state === 'walk' && Math.abs(w.bottom - t) < 12);
    }, { timeout: 10000 }).toBe(true);
  });

  test('a lemming picked up and dropped over the post lands on what is there', async ({ page }) => {
    await toFooter(page);
    await expect.poll(async () => (await walkers(page)).some(w => w.state === 'walk'), { timeout: 10000 }).toBe(true);
    const at = await pickUp(page);
    await page.mouse.move(at.x, at.y - 300, { steps: 10 });
    await page.waitForTimeout(200);   // a pause before letting go: a plain drop, not a throw
    await page.mouse.up();
    await page.mouse.move(1, 1);
    // it comes to rest on something in the post (the comments box, a paragraph...), well above the footer
    await expect.poll(async () => {
      const top = await footerTop(page);
      return (await walkers(page)).some(x => x.state === 'walk' && x.bottom < top - 50);
    }, { timeout: 10000 }).toBe(true);
    // and the lemmings still in the footer stay on its rule
    const top = await footerTop(page);
    for (const x of await walkers(page)) if (x.bottom > top - 50) expect(Math.abs(x.bottom - top)).toBeLessThan(12);
  });

  test('after one is picked up, the others still only see the footer (an overlay over it does not catch them)', async ({ page }) => {
    await toFooter(page);
    await expect.poll(async () => (await walkers(page)).filter(w => w.state === 'walk').length, { timeout: 10000 }).toBe(2);
    // pick one up and drop it over the post
    const at = await pickUp(page);
    await page.mouse.move(at.x, at.y - 300, { steps: 10 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.mouse.move(1, 1);
    // a big overlay over the footer area for a moment, like the image viewer
    await page.evaluate(() => {
      const o = document.createElement('div');
      o.id = 'test-overlay';
      o.style.cssText = 'position:fixed;left:0;right:0;top:30%;bottom:0;background:#333;z-index:10';
      document.body.append(o);
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.getElementById('test-overlay')!.remove());
    await page.waitForTimeout(1000);
    // the one nobody touched (still near the footer) is on the footer rule, not stranded up on the overlay's edge
    await expect.poll(async () => {
      await page.locator('.site-footer').scrollIntoViewIfNeeded();
      const top = await footerTop(page), ws = await walkers(page);
      const low = ws.filter(x => x.bottom > top - 400);
      return low.length > 0 && low.every(x => x.state === 'walk' && Math.abs(x.bottom - top) < 12);
    }, { timeout: 10000 }).toBe(true);
  });

  test('if the page grows just before the first pick-up, the other lemming still moves down with the footer', async ({ page }) => {
    await toFooter(page);
    await expect.poll(async () => (await walkers(page)).filter(w => w.state === 'walk').length, { timeout: 10000 }).toBe(2);
    // grow the page above the footer, then grab straight away (before the debounced re-measure)
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '400px';
      document.querySelector('.site-footer')!.before(spacer);
    });
    const at = await pickUp(page);
    await page.mouse.move(at.x + 10, at.y - 100, { steps: 3 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.mouse.move(1, 1);
    await expect.poll(async () => {
      await page.locator('.site-footer').scrollIntoViewIfNeeded();
      const top = await footerTop(page), ws = await walkers(page);
      // the untouched one: on the footer rule
      return ws.some(x => x.state === 'walk' && Math.abs(x.bottom - top) < 12);
    }, { timeout: 10000 }).toBe(true);
  });

  test('a dropped lemming lands on an opaque block whose colour has no blue (not mistaken for transparent)', async ({ page }) => {
    await toFooter(page);
    // a solid orange block, rgb(230, 81, 0), across the gap above the footer
    await page.evaluate(() => {
      const f = document.querySelector('.site-footer')!;
      const block = document.createElement('div');
      block.id = 'orange-block';
      block.style.cssText = 'height:24px;margin:0 0 160px;background:rgb(230, 81, 0)';
      f.before(block);
    });
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const at = await pickUp(page);
    const blockTop = await page.locator('#orange-block').evaluate(e => e.getBoundingClientRect().top);
    await page.mouse.move(at.x, blockTop - 80, { steps: 8 });
    await page.waitForTimeout(200);   // a pause: a plain drop
    await page.mouse.up();
    await page.mouse.move(1, 1);
    await expect.poll(async () => {
      const top = await page.locator('#orange-block').evaluate(e => e.getBoundingClientRect().top + scrollY);
      return (await walkers(page)).some(w => w.state === 'walk' && Math.abs(w.bottom - top) < 12);
    }, { timeout: 10000 }).toBe(true);
  });

  test('a thrown lemming bounces off and lands on the page, not through it', async ({ page }) => {
    await toFooter(page);
    await expect.poll(async () => (await walkers(page)).some(w => w.state === 'walk'), { timeout: 10000 }).toBe(true);
    const at = await pickUp(page);
    await page.mouse.move(at.x - 60, at.y - 200, { steps: 4 });
    await page.mouse.up();   // released mid-move: a throw up and to the left
    await page.mouse.move(1, 1);
    await expect.poll(async () => {
      const top = await footerTop(page);
      return (await walkers(page)).every(x => x.state === 'walk' || x.state === 'block') &&
        (await walkers(page)).some(x => x.bottom < top - 50);
    }, { timeout: 15000 }).toBe(true);
  });

  test('lemmings at the right edge never widen the page', async ({ page }) => {
    await toFooter(page);
    const top = await footerTop(page);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    // one walking and one falling under an open umbrella, right at the edge
    await add(page, { x: cw - 2, y: top - 20 });
    await page.evaluate(y => scrollTo(0, y - 650), top);
    // near the top of the view (always on screen) but below the sticky header
    await dropAndOpenUmbrella(page, async () => ({ x: cw - 2, y: await page.evaluate(() => scrollY + 120) }));
    for (let i = 0; i < 20; i++) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(cw);
      await page.waitForTimeout(100);
    }
  });

  test('a lemming that walks into the door goes home', async ({ page }) => {
    await toFooter(page);
    const door = await page.locator('.lemming-door').evaluate(d => {
      const r = d.getBoundingClientRect();
      return { x: r.left + scrollX + r.width / 2, y: r.top + scrollY - 20 };
    });
    await add(page, door);
    // keep the footer in view: late images can push it off-screen, where its lemmings pause
    await expect.poll(async () => {
      await page.locator('.site-footer').scrollIntoViewIfNeeded();
      return page.evaluate(() => (window as any).lemmings.home);
    }, { timeout: 10000 }).toBeGreaterThan(0);
  });

  test('tapping a falling lemming opens its umbrella and it floats down', async ({ page }) => {
    await toFooter(page);
    const top = await footerTop(page);
    await page.evaluate(y => scrollTo(0, y - 800), top);
    // near the top of the view (always on screen) but below the sticky header, in the empty left margin (a missed tap must not hit a link)
    await dropAndOpenUmbrella(page, async () => ({ x: 40, y: await page.evaluate(() => scrollY + 120) }));
    // under the umbrella it's still in the air a second later, where a free fall would have landed
    await page.waitForTimeout(1000);
    expect((await walkers(page)).at(-1)!.state).toBe('air');
  });

  test('turning on reduced motion before reaching the footer means nothing loads', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', r => requests.push(r.url()));
    await page.goto(ARTICLE_URL);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    expect(requests.some(u => u.includes('/js/lemmings.'))).toBe(false);
  });

  test('with reduced motion: nothing loads, no door, no lemmings', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const requests: string[] = [];
    page.on('request', r => requests.push(r.url()));
    await page.goto(ARTICLE_URL);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    expect(requests.some(u => u.includes('/js/lemmings.'))).toBe(false);
    expect(await page.evaluate(() => !!document.getElementById('lemmings'))).toBe(false);
    await expect(page.locator('.lemming-door')).toBeHidden();
    await ctx.close();
  });
});

test.describe('footer on the 404 page', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the 404 keeps its own four lemmings, with no footer pair on top', async ({ page }) => {
    await page.goto('/nonexistent-page-test');
    await expect.poll(async () => (await walkers(page)).length).toBe(4);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    expect((await walkers(page)).length).toBeLessThanOrEqual(4);
  });
});

test.describe('footer lemmings on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('two start in the footer', async ({ page }) => {
    await toFooter(page);
    await expect(page.locator('.lemming-door')).toBeVisible();
  });
});
