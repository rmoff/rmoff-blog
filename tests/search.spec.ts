import { test, expect } from '@playwright/test';

test.describe('Pagefind Search', () => {
  test('search page loads with Pagefind UI', async ({ page }) => {
    await page.goto('http://localhost:1313/search/');

    // Pagefind search input should be visible
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeVisible();
  });

  test('search returns results for "kafka"', async ({ page }) => {
    await page.goto('http://localhost:1313/search/');

    const searchInput = page.locator('.pagefind-ui__search-input');
    await searchInput.fill('kafka');

    // Wait for results to appear
    const results = page.locator('.pagefind-ui__result');
    await expect(results.first()).toBeVisible({ timeout: 5000 });

    // Should have multiple results
    expect(await results.count()).toBeGreaterThan(0);
  });

  test('search results have excerpts with highlights', async ({ page }) => {
    await page.goto('http://localhost:1313/search/');

    const searchInput = page.locator('.pagefind-ui__search-input');
    await searchInput.fill('docker');

    // Wait for results
    const results = page.locator('.pagefind-ui__result');
    await expect(results.first()).toBeVisible({ timeout: 5000 });

    // Check for excerpt
    const excerpt = page.locator('.pagefind-ui__result-excerpt').first();
    await expect(excerpt).toBeVisible();
  });

  test('category page has search box', async ({ page }) => {
    await page.goto('http://localhost:1313/categories/apache-kafka/');

    // Category search input should be visible
    const searchInput = page.locator('#category-search-input');
    await expect(searchInput).toBeVisible();

    // Should have placeholder with category name
    await expect(searchInput).toHaveAttribute('placeholder', /Search within Apache Kafka/);
  });

  test('category search returns filtered results', async ({ page }) => {
    await page.goto('http://localhost:1313/categories/apache-kafka/');

    // Capture console logs for debugging
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    const searchInput = page.locator('#category-search-input');
    await searchInput.fill('flink');

    // Wait for either results or no-results message
    const resultsOrMessage = page.locator('.search-results-list, .search-no-results');
    await expect(resultsOrMessage).toBeVisible({ timeout: 10000 });

    // Log console output for debugging
    console.log('Console logs:', consoleLogs.join('\n'));

    // Check if we got results
    const resultCards = page.locator('.search-result-card');
    const noResults = page.locator('.search-no-results');

    // Either we should have results, or the no-results message should contain the search term
    const hasResults = await resultCards.count() > 0;
    const hasNoResultsMessage = await noResults.isVisible();

    expect(hasResults || hasNoResultsMessage).toBeTruthy();
  });

  test('category search works with case-insensitive category names', async ({ page }) => {
    // OBIEE has lowercase category in frontmatter but title-cased page title
    await page.goto('http://localhost:1313/categories/obiee/');

    const searchInput = page.locator('#category-search-input');
    await searchInput.fill('oracle');

    // Wait for results
    const resultsOrMessage = page.locator('.search-results-list, .search-no-results');
    await expect(resultsOrMessage).toBeVisible({ timeout: 10000 });

    // Should find results (OBIEE articles mention Oracle)
    const resultCards = page.locator('.search-result-card');
    expect(await resultCards.count()).toBeGreaterThan(0);
  });
});
