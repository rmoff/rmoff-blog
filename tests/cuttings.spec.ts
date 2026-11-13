import { test, expect } from '@playwright/test';

// Needs a full build that includes the fixture cuttings, plus a Pagefind index:
//   hugo --config config.yaml,tests/fixtures/cuttings/config.yaml --destination <dir>
//   npx pagefind@1.5.2 --site <dir>
//   python3 -m http.server 1331 -d <dir>
//   BASE_URL=http://localhost:1331 npx playwright test tests/cuttings.spec.ts

const FIXTURE = '/cuttings/2026/10/16/fixture-comment-and-attributed-quote/';

test.describe('Cuttings section', () => {
  test('lists cuttings newest first, with the quote and its author', async ({ page }) => {
    await page.goto('/cuttings/');
    await expect(page.locator('.cuttings-list .cutting-title')).toHaveText([
      'Fixture: a cutting with a comment and an attributed quote',
      'AI Is Already In Dangerous Hands',
      'Confessions of an Unrepentant Slop Snob',
      'Agents: The new, New Kingmakers',
      'Fixture: a post of mine with an image',
    ]);
    const first = page.locator('.cuttings-list .cutting').first();
    await expect(first.locator('.cutting-title a')).toHaveAttribute('href', 'https://example.com/fixture-cutting');
    await expect(first.locator('.cutting-meta a')).toHaveAttribute('href', FIXTURE);
    await expect(first.locator('blockquote p')).toHaveCount(2);
    await expect(first.locator('figcaption')).toHaveText('— Someone Quoted');
    await expect(first.locator('figcaption')).toHaveCSS('text-align', 'right');
  });

  test('a post of mine says where I posted it; a share is dated and puts the link in a card', async ({ page }) => {
    await page.goto('/cuttings/');
    const mine = page.locator('.cuttings-list .cutting').filter({ hasText: 'Fixture: a post of mine with an image' });
    await expect(mine.locator('.cutting-meta')).toHaveText(/^\s*Posted on Bluesky\s*·\s*12 Oct 2026\s*$/);
    await expect(mine.locator('.cutting-meta a').first()).toHaveAttribute('href', 'https://bsky.app/profile/rmoff.net/post/fixture');
    await expect(mine.locator('.cutting-avatar, .cutting-by, .cutting-kind, .cutting-card')).toHaveCount(0);
    const shared = page.locator('.cuttings-list .cutting').first();
    await expect(shared.locator('.cutting-meta')).toHaveText(/^\s*16 Oct 2026\s*$/);
    await expect(shared.locator('.cutting-avatar, .cutting-by, .cutting-kind')).toHaveCount(0);
    await expect(shared.locator('.cutting-card .cutting-title a')).toHaveAttribute('href', 'https://example.com/fixture-cutting');
    await expect(shared.locator('.cutting-card blockquote')).toBeVisible();
    await expect(shared.locator('.cutting-card .cutting-comment')).toHaveCount(0);
    await expect(shared.locator('.cutting-comment')).toContainText('A line of commentary from me');
  });

  test('on the list, a post of mine is set like my comments and its pictures are kept short', async ({ page }) => {
    await page.goto('/cuttings/');
    const comment = await page.locator('.cuttings-list .cutting-comment').first().evaluate(el => getComputedStyle(el).fontSize);
    const mine = page.locator('.cuttings-list .cutting').filter({ hasText: 'Fixture: a post of mine with an image' });
    await expect(mine.locator('.cutting-title.cutting-text')).toHaveCSS('font-size', comment);
    await expect(mine.locator('.cutting-media img')).toHaveCSS('max-height', '352px');
  });

  test('a cutting page is the cutting in a card, under a link to Cuttings, with older and newer after it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/cuttings/');
    await expect(page.locator('.site-nav [aria-current]')).toHaveCount(1);
    await expect(page.locator('.site-nav a[href="/cuttings/"]')).toHaveAttribute('aria-current', 'page');
    await page.goto(FIXTURE);
    await expect(page.locator('h1.cutting-title')).toHaveText('Fixture: a cutting with a comment and an attributed quote');
    await expect(page.locator('.site-nav [aria-current]')).toHaveCount(1);
    await expect(page.locator('.site-nav a[href="/cuttings/"]')).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#mobile-nav a[href="/cuttings/"]')).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('.cutting-page .cutting')).toHaveCSS('border-top-style', 'solid');
    await expect(page.locator('.cutting-page > a.cutting-section')).toHaveText('Cuttings');
    await expect(page.locator('.cutting-page > a.cutting-section')).toHaveAttribute('href', '/cuttings/');
    await expect(page.locator('.post-end-swirl')).toHaveCount(0);
    await expect(page.locator('.post-older-newer [data-direction="newer"]')).toHaveCount(0);
    await expect(page.locator('.post-older-newer [data-direction="older"]')).toContainText('Older cutting');
    await expect(page.locator('.post-older-newer [data-direction="older"]')).toContainText('AI Is Already In Dangerous Hands');
  });

  test('a post of mine with no link shows its image and where it was posted', async ({ page }) => {
    await page.goto('/cuttings/2026/10/12/fixture-a-post-of-mine-with-an-image/');
    await expect(page.locator('h1.cutting-title')).toHaveText('Fixture: a post of mine with an image');
    await expect(page.locator('h1.cutting-title a')).toHaveCount(0);
    await expect(page.locator('.cutting-meta')).toHaveText(/^\s*Posted on Bluesky\s*·\s*12 Oct 2026\s*$/);
    await expect(page.locator('.cutting-meta a')).toHaveText('Bluesky');
    await expect(page.locator('.cutting-meta a')).toHaveAttribute('href', 'https://bsky.app/profile/rmoff.net/post/fixture');
    const img = page.locator('.cutting-media img');
    await expect(img).toHaveAttribute('alt', 'A plain grey rectangle');
    await expect(img).toHaveAttribute('width', '400');
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(400);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });

  test('the home page shows the latest three cuttings in the sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.latest-cuttings li')).toHaveCount(3);
    await expect(page.locator('.post-list a[href^="/cuttings/"]')).toHaveCount(0);
  });

  test('a line break in a post or a quote shows as a line break', async ({ page }) => {
    await page.goto(FIXTURE);
    const text = page.locator('.cutting :is(.cutting-comment, .cutting-text) p').first();
    expect(await text.innerText()).toBe('A line of commentary from me, with a link in it.\nA second line, straight after it.');
    expect(await page.locator('.cutting-quote blockquote p').first().innerText()).toBe(
      'The first paragraph of a quote, with bold and italic and code,\nand a line break.');
  });

  test('both feeds are advertised, and the main feed has posts only', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveCount(2);

    const main = await (await request.get('/index.xml')).text();
    expect(main).not.toContain('/cuttings/');
    expect(main).not.toContain('/about-me/');

    const cuttings = await (await request.get('/cuttings/index.xml')).text();
    expect(cuttings.match(/<item>/g)).toHaveLength(5);
    expect(cuttings).toContain('&lt;blockquote');

    // The feed describes itself in the section's own words, as the Cuttings page does
    // (the page's copy has typographic apostrophes, the feed's plain ones)
    await page.goto('/cuttings/');
    const plain = (s: string) => s.replace(/[‘’]/g, "'");
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    const channel = await page.evaluate(xml =>
      new DOMParser().parseFromString(xml, 'application/xml').querySelector('channel > description')!.textContent, cuttings);
    expect(description).toBeTruthy();
    expect(plain(channel!)).toBe(plain(description!));
  });
});

test.describe('Searching with and without cuttings', () => {
  const titles = (page) => page.locator('.cr-result-title');

  test.beforeEach(async ({ page }) => {
    await page.goto('/search/');
    await page.evaluate(() => localStorage.removeItem('searchShow'));
  });

  test('All, Posts and Cuttings filter the results', async ({ page }) => {
    await page.goto('/search/?q=snob');
    await expect(titles(page)).toHaveCount(2);
    await expect(page.locator('.cr-result-cutting .cr-result-type')).toHaveText('Cutting · charity.wtf');

    await page.locator('.search-show [data-show="posts"]').click();
    await expect(titles(page)).toHaveCount(1);
    await expect(page.locator('.cr-result-cutting')).toHaveCount(0);
    await expect(page).toHaveURL(/show=posts/);

    await page.locator('.search-show [data-show="cuttings"]').click();
    await expect(titles(page)).toHaveText(['Confessions of an Unrepentant Slop Snob']);
  });

  test('the choice is remembered, and the ⌘K palette follows it', async ({ page }) => {
    await page.goto('/search/?q=snob');
    await page.locator('.search-show [data-show="posts"]').click();
    await expect(titles(page)).toHaveCount(1);

    await page.goto('/search/?q=snob');
    await expect(page.locator('.search-show [data-show="posts"]')).toHaveClass(/active/);
    await expect(titles(page)).toHaveCount(1);

    await page.goto('/about-me/');
    await page.keyboard.press('ControlOrMeta+k');
    await page.locator('.sp-input').fill('snob');
    await expect(page.locator('.sp-group-label').last()).toHaveText('Posts');
    await expect(page.locator('.sp-post-type')).toHaveCount(0);
    await expect(page.locator('.sp-all')).toHaveText(/posts only/);
    await expect(page.locator('.sp-all')).toHaveAttribute('href', /show=posts/);
  });

  test('showing everything, a post on the subject comes before a cutting, unless the cutting is the best match', async ({ page }) => {
    // Unweighted, the short cutting page ranks first for "dangerous"
    await page.goto('/search/?q=dangerous');
    await expect(titles(page).first()).toHaveText(/^The danger of averages/);
    await expect(page.locator('.cr-result').nth(1)).toHaveClass(/cr-result-cutting/);
    await page.goto('/search/?q=kingmakers');
    await expect(titles(page).first()).toHaveText('Agents: The new, New Kingmakers');

    await page.goto('/about-me/');
    await page.keyboard.press('ControlOrMeta+k');
    await page.locator('.sp-input').fill('dangerous');
    await expect(page.locator('.sp-post-title').first()).toHaveText(/^The danger of averages/);
  });

  test('the palette labels cuttings when showing everything', async ({ page }) => {
    await page.goto('/about-me/');
    await page.keyboard.press('ControlOrMeta+k');
    await page.locator('.sp-input').fill('snob');
    await expect(page.locator('.sp-post-type')).toHaveText(['Cutting · charity.wtf']);
  });
});
