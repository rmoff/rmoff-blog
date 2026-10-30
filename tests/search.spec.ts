import { test, expect, type Page } from '@playwright/test';

// Needs a full build with a Pagefind index (the dev server has none), e.g.
//   hugo --destination <dir> && npx pagefind@1.5.2 --site <dir>
//   python3 -m http.server 1331 -d <dir>
//   BASE_URL=http://localhost:1331 npx playwright test tests/search.spec.ts

const RUN_TOGETHER_CATEGORIES = /Kafka Connect(offsets|REST|JDBC|Docker)/;

// The start of the 372-character SSH public key in the SampleApp v406 post, so it
// finds that post alone. The tests below fail on their length check if this stops
// being true: pick another query that highlights a long unbroken token, rather
// than dropping the check.
const LONG_TOKEN_QUERY = 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDMvNjJ8y1a3';
const LONG_TOKEN_MIN_LENGTH = 200;
const WRAP_VIEWPORTS = [{ width: 1280, height: 900 }, { width: 390, height: 844 }];

// body as well as html: at 640px and below the site sets overflow-x: hidden on
// both, so documentElement.scrollWidth stays at the window width even while the
// text runs off the edge and is cut off. body.scrollWidth still shows it.
async function expectNoSidewaysOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    window: document.documentElement.clientWidth,
  }));
  expect(widths.html).toBeLessThanOrEqual(widths.window);
  expect(widths.body).toBeLessThanOrEqual(widths.window);
}

// Every highlighted <mark>, with the right-hand edge of the box it must stay in.
async function measureMarks(page: Page, markSelector: string, boxSelector: string) {
  const marks = await page.locator(markSelector).evaluateAll((els, box) => els.map(mark => ({
    length: mark.textContent!.length,
    lines: mark.getClientRects().length,
    right: mark.getBoundingClientRect().right,
    boxRight: mark.closest(box)!.getBoundingClientRect().right,
  })), boxSelector);
  const longest = marks.reduce((a, b) => (b.length > a.length ? b : a));
  expect(longest.length).toBeGreaterThan(LONG_TOKEN_MIN_LENGTH);
  expect(longest.lines).toBeGreaterThan(1);
  for (const mark of marks) expect(mark.right).toBeLessThanOrEqual(mark.boxRight);
}

test.describe('Pagefind Search', () => {
  test('search page loads with Pagefind UI', async ({ page }) => {
    await page.goto('/search/');

    // Pagefind search input should be visible
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeVisible();
  });

  test('search input is auto-focused on page load', async ({ page }) => {
    await page.goto('/search/');

    // Wait for search input to be visible
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeVisible();

    // Search input should be focused
    await expect(searchInput).toBeFocused();
  });

  test('search input sits near the top of the page (no hero band)', async ({ page }) => {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/search/');
      const searchInput = page.locator('.pagefind-ui__search-input');
      await expect(searchInput).toBeVisible();
      const box = await searchInput.boundingBox();
      // Was ~290px with the hero photo + title band
      expect(box!.y).toBeLessThan(180);
    }
  });

  test('search input focus ring uses the accent colour', async ({ page }) => {
    await page.goto('/search/');
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeFocused();
    const { outlineColor, outlineStyle, accent } = await searchInput.evaluate(el => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-accent)';
      document.body.appendChild(probe);
      const accent = getComputedStyle(probe).color;
      probe.remove();
      const s = getComputedStyle(el);
      return { outlineColor: s.outlineColor, outlineStyle: s.outlineStyle, accent };
    });
    expect(outlineStyle).toBe('solid');
    expect(outlineColor).toBe(accent);
  });

  // The custom renderer (.cr-*) replaces PagefindUI's own results, which are hidden.
  test('search returns results for "kafka"', async ({ page }) => {
    await page.goto('/search/');

    const searchInput = page.locator('.pagefind-ui__search-input');
    await searchInput.fill('kafka');

    const results = page.locator('.cr-result');
    await expect(results.first()).toBeVisible({ timeout: 5000 });
    expect(await results.count()).toBeGreaterThan(0);
    await expect(page.locator('.cr-message')).toContainText('results for');
  });

  test('search results have excerpts with highlights', async ({ page }) => {
    await page.goto('/search/');

    const searchInput = page.locator('.pagefind-ui__search-input');
    await searchInput.fill('docker');

    const excerpt = page.locator('.cr-result-excerpt').first();
    await expect(excerpt).toBeVisible({ timeout: 5000 });
    await expect(excerpt.locator('mark').first()).toBeVisible();
  });

  test('excerpts are ~25 words and free of category names and 🔗 anchors', async ({ page }) => {
    await page.goto('/search/?q=kafka%20connect');

    const excerpts = page.locator('.cr-result-excerpt');
    await expect(excerpts.first()).toBeVisible({ timeout: 5000 });
    const texts = await excerpts.allTextContents();
    expect(texts.length).toBeGreaterThan(5);

    const wordCounts = texts.map(t => t.split(/\s+/).filter(Boolean).length);
    // Pagefind trims to whole words around the match; was exactly 10 before
    expect(Math.max(...wordCounts)).toBeGreaterThanOrEqual(20);

    for (const t of texts) {
      expect(t).not.toMatch(RUN_TOGETHER_CATEGORIES);
      expect(t).not.toContain('🔗');
    }
  });

  test('a long unbroken token in an excerpt wraps inside its result card', async ({ page }) => {
    for (const viewport of WRAP_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(`/search/?q=${LONG_TOKEN_QUERY}`);
      await expect(page.locator('.cr-result-excerpt mark').first()).toBeVisible({ timeout: 5000 });

      await measureMarks(page, '.cr-result-excerpt mark', '.cr-result');
      await expectNoSidewaysOverflow(page);
    }
  });

  test('a long pasted query wraps in the results line and keeps the sort buttons whole', async ({ page }) => {
    for (const viewport of WRAP_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(`/search/?q=${'zzq'.repeat(120)}`);
      const message = page.locator('.cr-message');
      await expect(message).toBeVisible({ timeout: 5000 });

      const { queryRight, messageRight } = await message.evaluate(el => ({
        queryRight: el.querySelector('strong')!.getBoundingClientRect().right,
        messageRight: el.getBoundingClientRect().right,
      }));
      expect(queryRight).toBeLessThanOrEqual(messageRight);
      await expectNoSidewaysOverflow(page);

      // Wrapping must not reach the buttons: each label stays on one line
      const lineCounts = await page.locator('.search-sort-btn').evaluateAll(buttons => buttons.map(button => {
        const label = document.createRange();
        label.selectNodeContents(button);
        return label.getClientRects().length;
      }));
      expect(lineCounts).toEqual([1, 1, 1]);
    }
  });

  test('a long unbroken token in a palette excerpt wraps inside the palette', async ({ page }) => {
    for (const viewport of WRAP_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.keyboard.press('ControlOrMeta+k');
      await page.locator('.sp-input').fill(LONG_TOKEN_QUERY);
      await expect(page.locator('.sp-post-excerpt mark').first()).toBeVisible({ timeout: 10000 });

      await measureMarks(page, '.sp-post-excerpt mark', '.sp-panel');
      const results = page.locator('.sp-body');
      const { scrollWidth, clientWidth } = await results.evaluate(el => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      await expectNoSidewaysOverflow(page);
    }
  });

  test('?q= restores the query and sort buttons work', async ({ page }) => {
    await page.goto('/search/?q=flink');
    await expect(page.locator('.pagefind-ui__search-input')).toHaveValue('flink');
    await expect(page.locator('.cr-result').first()).toBeVisible({ timeout: 5000 });

    await page.locator('.search-sort-btn[data-sort="newest"]').click();
    await expect(page).toHaveURL(/sort=newest/);
    await expect(page.locator('.search-sort-btn[data-sort="newest"]')).toHaveClass(/active/);
  });

  test('category page has search box', async ({ page }) => {
    await page.goto('/categories/apache-kafka/');

    // Category search input should be visible
    const searchInput = page.locator('#category-search-input');
    await expect(searchInput).toBeVisible();

    // Should have placeholder with category name
    await expect(searchInput).toHaveAttribute('placeholder', /Search within Apache Kafka/);
  });

  test('category search returns filtered results', async ({ page }) => {
    await page.goto('/categories/apache-kafka/');

    const searchInput = page.locator('#category-search-input');
    await searchInput.fill('flink');

    // Wait for either results or no-results message
    const resultsContainer = page.locator('#category-search-results');
    await expect(resultsContainer).toBeVisible({ timeout: 10000 });

    // Check if we got results or no-results message
    const resultRows = resultsContainer.locator('.post-row');
    const noResults = page.locator('.cat-search-no-results');

    const hasResults = await resultRows.count() > 0;
    const hasNoResultsMessage = await noResults.isVisible();

    expect(hasResults || hasNoResultsMessage).toBeTruthy();
  });

  test('category search only returns posts from that category', async ({ page }) => {
    // "kafka" matches hundreds of posts site-wide; within Apache Flink it must be fewer
    await page.goto('/categories/apache-flink/');
    const articleCount = await page.locator('#category-article-list .post-row').count();

    await page.locator('#category-search-input').fill('kafka');
    const count = page.locator('.cat-search-count');
    await expect(count).toBeVisible({ timeout: 10000 });
    const n = parseInt((await count.textContent())!, 10);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(articleCount);
  });

  test('category search works with case-insensitive category names', async ({ page }) => {
    // OBIEE has lowercase category in frontmatter but title-cased page title
    await page.goto('/categories/obiee/');

    const searchInput = page.locator('#category-search-input');
    await searchInput.fill('oracle');

    // Wait for results
    const resultsContainer = page.locator('#category-search-results');
    await expect(resultsContainer).toBeVisible({ timeout: 10000 });

    // Should find results (OBIEE articles mention Oracle)
    const resultRows = resultsContainer.locator('.post-row');
    expect(await resultRows.count()).toBeGreaterThan(0);
  });
});
