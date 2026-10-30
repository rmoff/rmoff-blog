import { test, expect, type Page, type Route } from '@playwright/test';

// Needs a full build with a Pagefind index (the dev server has none), e.g.
//   hugo --destination <dir> && npx pagefind@1.5.2 --site <dir>
//   python3 -m http.server 1331 -d <dir>
//   BASE_URL=http://localhost:1331 npx playwright test tests/search.spec.ts

const RUN_TOGETHER_CATEGORIES = /Kafka Connect(offsets|REST|JDBC|Docker)/;

// Holds matching Pagefind requests back until release() is called, so a search
// can be kept in flight for as long as a test needs. hold(false) lets new
// requests through while the ones already held stay held.
async function gate(page: Page, pattern: string) {
  const held: Route[] = [];
  let holding = true;
  await page.route(pattern, route => {
    if (holding) held.push(route);
    else route.continue();
  });
  return {
    hold: (on: boolean) => { holding = on; },
    heldCount: () => held.length,
    release: async () => {
      holding = false;
      await Promise.all(held.splice(0).map(r => r.continue()));
    },
  };
}

// Opens /search/ and waits for Pagefind's filter data. Without it a search returns
// no category counts, so a test on the category chips would pass or fail by luck.
async function openSearchWithFilters(page: Page) {
  const filters = page.waitForResponse('**/pagefind/filter/**');
  await page.goto('/search/');
  await filters;
  await expect(page.locator('.pagefind-ui__search-input')).toBeFocused();
}

// Beats both debounces (150ms results, 200ms categories) on the page's own clock,
// so a slow machine can't end the wait before they have fired.
function pastDebounces(page: Page) {
  return page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));
}

// Returns once a search for `term` that should have been dropped has had its chance
// to render. A fixed wait can end first on a loaded machine and pass by accident, so
// this runs the same search in the page: it shares Pagefind's loaded data and queues
// behind the stalled search, so that search has finished by the time this one does.
// A string, so Playwright's compiler leaves the dynamic import alone.
async function searchSettled(page: Page, term: string) {
  await pastDebounces(page);
  await page.evaluate(`(async () => {
    const pagefind = await import('/pagefind/pagefind.js');
    const search = await pagefind.search(${JSON.stringify(term)});
    await Promise.all(search.results.slice(0, 10).map(r => r.data()));
    await new Promise(resolve => setTimeout(resolve));
  })()`);
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

  test('?q= restores the query and sort buttons work', async ({ page }) => {
    await page.goto('/search/?q=flink');
    await expect(page.locator('.pagefind-ui__search-input')).toHaveValue('flink');
    await expect(page.locator('.cr-result').first()).toBeVisible({ timeout: 5000 });

    await page.locator('.search-sort-btn[data-sort="newest"]').click();
    await expect(page).toHaveURL(/sort=newest/);
    await expect(page.locator('.search-sort-btn[data-sort="newest"]')).toHaveClass(/active/);
  });

  test.describe('Clear button', () => {
    async function expectCleared(page: Page) {
      await expect(page.locator('.pagefind-ui__search-input')).toHaveValue('');
      await expect(page.locator('#custom-results')).toBeEmpty();
      await expect(page.locator('#category-results')).toBeEmpty();
      await expect(page.locator('#search-suggestions')).toBeVisible();
      expect(new URL(page.url()).searchParams.has('q')).toBe(false);
    }

    test('clears results, category chips and ?q, and keeps the cursor in the box', async ({ page }) => {
      await openSearchWithFilters(page);
      await page.locator('.pagefind-ui__search-input').fill('Flink');
      await expect(page.locator('.cr-result').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#category-results a').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#search-suggestions')).toBeHidden();
      await expect(page).toHaveURL(/q=Flink/);

      await page.locator('.pagefind-ui__search-clear').click();

      await expectCleared(page);
      await expect(page.locator('.pagefind-ui__search-input')).toBeFocused();

      // Refreshing must not bring the search back
      await page.reload();
      await expect(page.locator('.pagefind-ui__search-input')).toBeVisible();
      await searchSettled(page, 'Flink');
      await expectCleared(page);
    });

    test('keeps the chosen sort, as deleting the text by hand does', async ({ page }) => {
      await page.goto('/search/?q=Flink&sort=newest');
      await expect(page.locator('.cr-result').first()).toBeVisible({ timeout: 5000 });

      await page.locator('.pagefind-ui__search-clear').click();

      await expectCleared(page);
      expect(new URL(page.url()).search).toBe('?sort=newest');

      await page.locator('.pagefind-ui__search-input').fill('kafka');
      await expect(page.locator('.search-sort-btn[data-sort="newest"]')).toHaveClass(/active/, { timeout: 5000 });
      await expect(page).toHaveURL(/q=kafka/);
      await expect(page).toHaveURL(/sort=newest/);
    });

    test('cancels a search still waiting on its debounce', async ({ page }) => {
      await openSearchWithFilters(page);

      // Same task, so Clear lands inside the debounce whatever the machine's speed
      await page.evaluate(async () => {
        const input = document.querySelector<HTMLInputElement>('.pagefind-ui__search-input')!;
        input.value = 'Flink';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await Promise.resolve(); // Lets PagefindUI reveal the Clear button
        document.querySelector<HTMLButtonElement>('.pagefind-ui__search-clear')!.click();
      });

      await searchSettled(page, 'Flink');
      await expectCleared(page);
    });

    test('drops results and category chips from a search already in flight', async ({ page }) => {
      await openSearchWithFilters(page);

      // Both searches need this before they can return, so both stall here
      const index = await gate(page, '**/pagefind/index/**');
      await page.locator('.pagefind-ui__search-input').fill('Flink');
      await expect.poll(index.heldCount).toBeGreaterThan(0);
      await pastDebounces(page);

      await page.locator('.pagefind-ui__search-clear').click();
      await index.release();

      await searchSettled(page, 'Flink');
      await expectCleared(page);
    });

    test('drops results from a search that is fetching its result data', async ({ page }) => {
      await openSearchWithFilters(page);

      const fragments = await gate(page, '**/pagefind/fragment/**');
      await page.locator('.pagefind-ui__search-input').fill('Flink');
      await expect.poll(fragments.heldCount).toBeGreaterThan(0);

      await page.locator('.pagefind-ui__search-clear').click();
      await fragments.release();

      await searchSettled(page, 'Flink');
      await expectCleared(page);
    });
  });

  test('an older search finishing late does not replace a newer one', async ({ page }) => {
    await page.goto('/search/');
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeFocused();

    // Two terms with no posts in common, so they share no result data
    const fragments = await gate(page, '**/pagefind/fragment/**');
    await searchInput.fill('flink');
    await expect.poll(fragments.heldCount).toBeGreaterThan(0);

    fragments.hold(false);
    await searchInput.fill('obiee');
    await expect(page.locator('.cr-message')).toContainText('results for obiee', { timeout: 5000 });

    await fragments.release();
    await searchSettled(page, 'flink');
    await expect(page.locator('.cr-message')).toContainText('results for obiee');
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
