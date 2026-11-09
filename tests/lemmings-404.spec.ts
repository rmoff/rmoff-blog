import { test, expect, Page } from '@playwright/test';

// Lemmings on the 404 page (static/js/lemmings.js, layouts/404.html).
const MISSING_URL = '/nonexistent-page-test';

const wraps = (page: Page) => page.evaluate(() =>
  [...(document.getElementById('lemmings')?.shadowRoot?.querySelectorAll<HTMLElement>('.wrap:not(.gone)') ?? [])]
    .map(w => {
      const r = w.querySelector('i')!.getBoundingClientRect();
      return { state: w.dataset.state, x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top, right: r.right };
    }));
const states = async (page: Page) => (await wraps(page)).map(w => w.state);

test.describe('404 lemmings', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('four lemmings start on the 404 page and walk', async ({ page }) => {
    await page.goto(MISSING_URL);
    await expect.poll(async () => (await wraps(page)).length).toBe(4);
    await expect.poll(() => states(page), { timeout: 10000 }).toContain('walk');
  });

  test('the 404 text is unchanged: no lemmings lines added', async ({ page }) => {
    await page.goto(MISSING_URL);
    await expect(page.locator('.terminal-page')).not.toContainText('lemming');
    await expect(page.locator('.terminal-prompt')).toHaveText(['$ cat popular_categories.txt', '$ tail -n5 posts.txt', '$ find . -name "*"', '$ cd ~', '$ _']);
  });

  test('a lemming dropped on "cd ~" goes home', async ({ page }) => {
    await page.goto(MISSING_URL);
    await expect.poll(async () => (await wraps(page)).length).toBe(4);
    const exit = await page.locator('.terminal-home-link[data-lemming-exit]').evaluate(e => {
      const r = e.getBoundingClientRect();
      return { x: r.left + scrollX + 12, y: r.top + scrollY - 2 };   // feet just above "# go home"
    });
    await page.evaluate(at => (window as any).lemmings.add(at), exit);
    await expect.poll(() => page.evaluate(() => (window as any).lemmings.home), { timeout: 10000 }).toBeGreaterThan(0);
  });

  test('tapping a walking lemming makes it a blocker, tapping again sets it walking', async ({ page }) => {
    await page.goto(MISSING_URL);
    await expect.poll(() => states(page), { timeout: 10000 }).toContain('walk');
    const tap = async (state: string) => {
      const w = (await wraps(page)).find(x => x.state === state);
      expect(w, `a lemming in state ${state}`).toBeTruthy();
      await page.mouse.click(w!.x, w!.y);
    };
    await tap('walk');
    await expect.poll(() => states(page)).toContain('block');
    await tap('block');
    await expect.poll(() => states(page)).not.toContain('block');
  });

  test('a click near a walking lemming makes it hop', async ({ page }) => {
    await page.goto(MISSING_URL);
    await expect.poll(() => states(page), { timeout: 10000 }).toEqual(['walk', 'walk', 'walk', 'walk']);
    // click beside one, on a spot that is not a link (a link would navigate away)
    const spot = await page.evaluate(() => {
      for (const w of document.getElementById('lemmings')!.shadowRoot!.querySelectorAll<HTMLElement>('.wrap')) {
        if (w.dataset.state !== 'walk') continue;
        const r = w.querySelector('i')!.getBoundingClientRect();
        for (const [x, y] of [[r.right + 30, r.top + 20], [r.left - 30, r.top + 20], [r.left + 16, r.top - 30]]) {
          const el = document.elementFromPoint(x, y);
          if (el && !el.closest('a') && y > 0 && y < innerHeight) return { x, y };
        }
      }
      return null;
    });
    expect(spot).toBeTruthy();
    await page.mouse.click(spot!.x, spot!.y);
    await expect.poll(() => states(page)).toContain('air');
  });

  test('hovering near a walking lemming does not stop it', async ({ page }) => {
    await page.goto(MISSING_URL);
    await expect.poll(() => states(page), { timeout: 10000 }).toEqual(['walk', 'walk', 'walk', 'walk']);
    // keep the pointer just above it for three seconds, as a reader's mouse might rest; it keeps walking
    // (it may walk off a line end and fall, so only compare samples where it was walking both times)
    let last = (await wraps(page))[0], walking = 0, stood = 0;
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(last.x + 30, last.top - 30, { steps: 2 });
      await page.waitForTimeout(150);
      const now = (await wraps(page))[0];
      if (last.state === 'walk' && now.state === 'walk') {
        walking++;
        if (Math.abs(now.x - last.x) < 4) stood++;
      }
      last = now;
    }
    expect(walking).toBeGreaterThanOrEqual(3);
    expect(stood).toBe(0);
  });
});

test.describe('404 lemmings with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('no lemmings', async ({ page }) => {
    await page.goto(MISSING_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => !!document.getElementById('lemmings'))).toBe(false);
  });
});
