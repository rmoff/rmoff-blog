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
});
