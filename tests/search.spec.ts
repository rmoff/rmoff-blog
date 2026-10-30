import { test, expect, type Page } from '@playwright/test';

// Needs a full build with a Pagefind index (the dev server has none), e.g.
//   hugo --destination <dir> && npx pagefind@1.5.2 --site <dir>
//   python3 -m http.server 1331 -d <dir>
//   BASE_URL=http://localhost:1331 npx playwright test tests/search.spec.ts

const RUN_TOGETHER_CATEGORIES = /Kafka Connect(offsets|REST|JDBC|Docker)/;

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

  test.describe('category search with more than one batch of results', () => {
    const rows = '#category-search-results .post-row';
    const loadMore = '#category-search-results .cr-load-more';

    async function searchKafkaConnect(page: Page) {
      await page.goto('/categories/kafka-connect/');
      await page.locator('#category-search-input').fill('kafka');
      await expect(page.locator(rows)).toHaveCount(20, { timeout: 10000 });
      const total = parseInt((await page.locator('.cat-search-count').textContent())!, 10);
      expect(total).toBeGreaterThan(40); // so the last batch isn't also the second
      return total;
    }

    // Holds Pagefind's result fragments until release(); stopHolding() lets later ones through
    async function holdNextBatch(page: Page) {
      let holding = true;
      let release = () => {};
      const held = new Promise<void>(resolve => { release = resolve; });
      await page.route('**/pagefind/fragment/**', async route => {
        if (holding) await held;
        await route.continue();
      });
      return { release: () => release(), stopHolding: () => { holding = false; } };
    }

    test('every counted result can be reached, then Load more goes away', async ({ page }) => {
      const total = await searchKafkaConnect(page);

      while (await page.locator(loadMore).isVisible()) {
        const before = await page.locator(rows).count();
        await page.locator(loadMore).click();
        await expect(page.locator(rows)).not.toHaveCount(before);
      }

      await expect(page.locator(rows)).toHaveCount(total);
      const urls = await page.locator(`${rows} .post-title-link`).evaluateAll(
        links => links.map(a => a.getAttribute('href'))
      );
      expect(new Set(urls).size).toBe(total);
    });

    test('scrolling near the end of the list loads the next batch', async ({ page }) => {
      await searchKafkaConnect(page);

      await page.locator(loadMore).evaluate(el => el.scrollIntoView());

      await expect(page.locator(rows)).toHaveCount(40);
    });

    test('a search that finishes after a newer one does not replace it', async ({ page }) => {
      await page.goto('/categories/kafka-connect/');
      await page.waitForLoadState('networkidle');
      let heldRequests = 0;
      page.on('request', r => { if (r.url().includes('/pagefind/fragment/')) heldRequests++; });
      const { release, stopHolding } = await holdNextBatch(page);
      const input = page.locator('#category-search-input');

      await input.fill('kafka');
      await expect.poll(() => heldRequests).toBeGreaterThan(0);
      stopHolding();

      // Quoted, as Pagefind matches unquoted nonsense loosely
      await input.fill('"zzzqqxnomatch"');
      await expect(page.locator('.cat-search-no-results')).toBeVisible({ timeout: 10000 });

      release();
      await page.waitForTimeout(500);

      await expect(page.locator('.cat-search-no-results')).toBeVisible();
      await expect(page.locator(rows)).toHaveCount(0);
    });

    test('a batch that arrives after a new search is ignored', async ({ page }) => {
      const total = await searchKafkaConnect(page);
      let heldRequests = 0;
      page.on('request', r => { if (r.url().includes('/pagefind/fragment/')) heldRequests++; });
      const { release, stopHolding } = await holdNextBatch(page);
      await page.locator(loadMore).click();
      await expect.poll(() => heldRequests).toBeGreaterThan(0);
      stopHolding();

      // Narrow query, so its own fragments aren't the ones being held
      await page.locator('#category-search-input').fill('snowflake');
      const count = page.locator('.cat-search-count');
      await expect(count).not.toHaveText(`${total} results`, { timeout: 10000 });
      const expected = parseInt((await count.textContent())!, 10);
      await expect(page.locator(rows)).toHaveCount(expected);

      release();
      await page.waitForTimeout(500);

      await expect(page.locator(rows)).toHaveCount(expected);
    });

    test('a batch that arrives after Clear does not come back', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      await searchKafkaConnect(page);
      const { release } = await holdNextBatch(page);
      await page.locator(loadMore).click();

      await page.locator('#category-search-clear').click();
      release();
      await page.waitForTimeout(500);

      await expect(page.locator('#category-search-results')).toBeHidden();
      await expect(page.locator(rows)).toHaveCount(0);
      expect(errors).toEqual([]);
    });

    test('finishing with the keyboard keeps focus on the results', async ({ page }) => {
      const total = await searchKafkaConnect(page);

      // Focusing the button scrolls it into view, so auto-load runs alongside Enter
      await page.locator(loadMore).focus();
      for (let i = 0; i < 10 && await page.locator(loadMore).count(); i++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }

      await expect(page.locator(rows)).toHaveCount(total);
      await expect(page.locator(loadMore)).toHaveCount(0);
      const firstOfLastBatch = page.locator(rows).nth(Math.floor((total - 1) / 20) * 20);
      await expect(firstOfLastBatch.locator('.post-title-link')).toBeFocused();
    });

    test('auto-loading the last batch does not move focus', async ({ page }) => {
      const total = await searchKafkaConnect(page);
      const input = page.locator('#category-search-input');
      await input.focus();

      for (let i = 0; i < 5 && await page.locator(loadMore).count(); i++) {
        await page.locator(loadMore).evaluate(el => el.scrollIntoView());
        await page.waitForTimeout(300);
      }

      await expect(page.locator(rows)).toHaveCount(total);
      await expect(input).toBeFocused();
    });
  });
});
