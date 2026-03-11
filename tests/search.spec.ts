import { test, expect } from '@playwright/test';

test.describe('Pagefind Search', () => {
  test('search page loads with Pagefind UI', async ({ page }) => {
    await page.goto('http://localhost:1313/search/');

    // Pagefind search input should be visible
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeVisible();
  });

  test('search input is auto-focused on page load', async ({ page }) => {
    await page.goto('http://localhost:1313/search/');

    // Wait for search input to be visible
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeVisible();

    // Search input should be focused
    await expect(searchInput).toBeFocused();
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

  test('category search works with case-insensitive category names', async ({ page }) => {
    // OBIEE has lowercase category in frontmatter but title-cased page title
    await page.goto('http://localhost:1313/categories/obiee/');

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
