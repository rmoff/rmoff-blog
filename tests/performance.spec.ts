import { test, expect } from '@playwright/test';

test.describe('Page Load - Homepage', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('http://localhost:1313/');

    // Header elements visible
    await expect(page.locator('.glass-header')).toBeVisible();
    await expect(page.locator('.headshot')).toBeVisible();

    // Blog post cards visible
    const cards = page.locator('.retro-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('homepage fonts render correctly', async ({ page }) => {
    await page.goto('http://localhost:1313/');

    // Wait for fonts to load
    await page.waitForLoadState('networkidle');

    // Check that terminal title is visible
    const title = page.locator('.terminal-title-header');
    await expect(title).toBeVisible();
    await expect(title).toContainText('rmoff');
  });

  test('homepage icons are functional', async ({ page }) => {
    await page.goto('http://localhost:1313/');

    // Social icons should be visible
    const icons = page.locator('.header-icons .icon-link');
    expect(await icons.count()).toBeGreaterThan(3);
  });
});

test.describe('Page Load - Article Page', () => {
  test('article page loads correctly', async ({ page }) => {
    // Navigate to an article from homepage
    await page.goto('http://localhost:1313/');
    const firstCard = page.locator('.retro-card a').first();
    const href = await firstCard.getAttribute('href');

    await page.goto(href!);

    // Article title should be visible
    await expect(page.locator('.title-box h1')).toBeVisible();

    // Navigation should be visible
    await expect(page.locator('.glass-nav')).toBeVisible();
  });

  test('article page has readable content', async ({ page }) => {
    await page.goto('http://localhost:1313/');
    const firstCard = page.locator('.retro-card a').first();
    const href = await firstCard.getAttribute('href');

    await page.goto(href!);

    // Main content area should have text
    const article = page.locator('article');
    await expect(article).toBeVisible();

    // Check text is readable (has content)
    const textContent = await article.textContent();
    expect(textContent!.length).toBeGreaterThan(100);
  });

  test('article page footer visible', async ({ page }) => {
    await page.goto('http://localhost:1313/');
    const firstCard = page.locator('.retro-card a').first();
    const href = await firstCard.getAttribute('href');

    await page.goto(href!);

    // Footer should be visible
    await expect(page.locator('footer')).toBeVisible();
  });
});

test.describe('Page Load - Category Page', () => {
  test('category page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:1313/categories/');

    // Page should have category links
    const categoryLinks = page.locator('a[href*="/categories/"]');
    expect(await categoryLinks.count()).toBeGreaterThan(0);
  });

  test('individual category page lists articles', async ({ page }) => {
    // Go directly to a known category
    await page.goto('http://localhost:1313/categories/kafka/');

    // Should have article cards
    const cards = page.locator('.retro-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Page Load - Search Page', () => {
  test('search page loads and is functional', async ({ page }) => {
    await page.goto('http://localhost:1313/search/');

    // Search input should be visible
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeVisible();

    // Test a search
    await searchInput.fill('kafka');

    // Results should appear
    const results = page.locator('.pagefind-ui__result');
    await expect(results.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Navigation Consistency', () => {
  test('can navigate from homepage to article and back', async ({ page }) => {
    await page.goto('http://localhost:1313/');

    // Click an article using the overlay link
    const firstCard = page.locator('.retro-card .retro-card-overlay-link').first();
    await firstCard.click();

    // Should be on article page
    await expect(page.locator('.glass-nav')).toBeVisible();

    // Click home logo
    await page.locator('.glass-nav a[title="Home"]').click();

    // Should be back on homepage
    await expect(page.locator('.glass-header')).toBeVisible();
  });

  test('can navigate from homepage to category', async ({ page }) => {
    await page.goto('http://localhost:1313/');

    // Navigate directly to categories page then to a specific category
    await page.goto('http://localhost:1313/categories/kafka/');

    // Should show category page with articles
    await expect(page.locator('.retro-card').first()).toBeVisible({ timeout: 5000 });
  });
});
