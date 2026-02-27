import { test, expect } from '@playwright/test';

const IL_URL = 'http://localhost:1313/2026/01/20/interesting-links-january-2026/';

// The checkbox is visually hidden behind a custom toggle switch,
// so we click the label instead of calling .check() on the input.
async function toggleFireFilter(page) {
  await page.locator('#il-fire-toggle').click();
  await page.waitForTimeout(100);
}

test.describe('IL Filter & Collapse', () => {

  test('toolbar is rendered on IL page', async ({ page }) => {
    await page.goto(IL_URL);
    const toolbar = page.locator('.il-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(page.locator('#il-fire-cb')).toBeAttached();
  });

  test('sections have chevrons and count badges', async ({ page }) => {
    await page.goto(IL_URL);
    const chevrons = page.locator('.il-chevron');
    expect(await chevrons.count()).toBeGreaterThan(5);

    // Badges exist but are hidden when filter is off
    const badges = page.locator('.il-section-count');
    expect(await badges.count()).toBeGreaterThan(5);
    await expect(badges.first()).toBeHidden();

    // Badges become visible when filter is on
    await toggleFireFilter(page);
    await expect(badges.first()).toBeVisible();
  });

  test('clicking h2 collapses and expands section', async ({ page }) => {
    await page.goto(IL_URL);

    const kafkaSection = page.locator('#_kafka_and_event_streaming').locator('..');
    const kafkaH2 = kafkaSection.locator('h2');
    const kafkaBody = kafkaSection.locator('.sectionbody');

    await expect(kafkaBody).toBeVisible();

    await kafkaH2.click();
    await expect(kafkaSection).toHaveClass(/il-collapsed/);

    await kafkaH2.click();
    await expect(kafkaSection).not.toHaveClass(/il-collapsed/);
  });

  test('fire filter hides non-fire non-rmoff items', async ({ page }) => {
    await page.goto(IL_URL);

    const kafkaSection = page.locator('#_kafka_and_event_streaming').locator('..');
    const kafkaItems = kafkaSection.locator('.sectionbody li');
    const totalBefore = await kafkaItems.count();
    expect(totalBefore).toBeGreaterThan(2);

    await toggleFireFilter(page);

    const hiddenItems = kafkaSection.locator('.sectionbody li.il-hidden');
    const hiddenCount = await hiddenItems.count();
    expect(hiddenCount).toBeGreaterThan(0);

    const visibleItems = kafkaSection.locator('.sectionbody li:not(.il-hidden)');
    const visibleCount = await visibleItems.count();
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThan(totalBefore);

    const countEl = page.locator('#il-count');
    await expect(countEl).toContainText('of');
  });

  test('rmoff.net links are always visible when filter is on', async ({ page }) => {
    await page.goto(IL_URL);

    await toggleFireFilter(page);

    const hiddenItems = page.locator('li.il-hidden');
    const hiddenCount = await hiddenItems.count();

    for (let i = 0; i < hiddenCount; i++) {
      const rmoffLinks = hiddenItems.nth(i).locator('a[href*="rmoff.net"]');
      expect(await rmoffLinks.count()).toBe(0);
    }
  });

  test('disabling filter restores all items', async ({ page }) => {
    await page.goto(IL_URL);

    await toggleFireFilter(page);
    await toggleFireFilter(page);

    const hiddenAfter = page.locator('[data-il-section="true"] .sectionbody li.il-hidden');
    expect(await hiddenAfter.count()).toBe(0);

    // Count should show total (not filtered)
    const countEl = page.locator('#il-count');
    await expect(countEl).toContainText('links');
    await expect(countEl).not.toContainText('of');
  });

  test('"show all" link appears when filter is active', async ({ page }) => {
    await page.goto(IL_URL);

    // "show all" links are hidden when filter is off
    const showAllLinks = page.locator('.il-show-all');
    expect(await showAllLinks.count()).toBeGreaterThan(0);
    await expect(showAllLinks.first()).toBeHidden();

    // Enable filter
    await toggleFireFilter(page);

    // "show all" links should now be visible on sections with items
    const visibleShowAll = page.locator('[data-il-section="true"]:not(.il-section-empty) .il-show-all');
    await expect(visibleShowAll.first()).toBeVisible();
  });

  test('clicking "show all" disables the filter', async ({ page }) => {
    await page.goto(IL_URL);

    // Enable filter
    await toggleFireFilter(page);

    // Verify filter is on
    const cb = page.locator('#il-fire-cb');
    await expect(cb).toBeChecked();

    // Click "show all" on any visible section
    const showAllLink = page.locator('[data-il-section="true"]:not(.il-section-empty) .il-show-all').first();
    await showAllLink.click();
    await page.waitForTimeout(100);

    // Filter should be off now
    await expect(cb).not.toBeChecked();

    // All items should be visible
    const hiddenItems = page.locator('[data-il-section="true"] .sectionbody li.il-hidden');
    expect(await hiddenItems.count()).toBe(0);
  });

  test('toolbar is NOT rendered on non-IL pages', async ({ page }) => {
    await page.goto('http://localhost:1313/');
    const toolbar = page.locator('.il-toolbar');
    await expect(toolbar).not.toBeAttached();
  });

  test('toolbar is sticky', async ({ page }) => {
    await page.goto(IL_URL);
    await page.waitForSelector('.il-toolbar');

    // Scroll well past the toolbar
    const kafkaSection = page.locator('#_stream_processing');
    await kafkaSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Toolbar should still be visible (sticky)
    const toolbar = page.locator('.il-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toBeInViewport();
  });

  test('screenshot: default state', async ({ page }) => {
    await page.goto(IL_URL);
    await page.waitForSelector('.il-toolbar');
    await page.locator('.il-toolbar').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'tests/screenshots/il-filter-default.png', fullPage: false });
  });

  test('screenshot: fire filter active', async ({ page }) => {
    await page.goto(IL_URL);
    await page.waitForSelector('.il-toolbar');
    await page.locator('.il-toolbar').scrollIntoViewIfNeeded();
    await toggleFireFilter(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/il-filter-fire.png', fullPage: false });
  });
});
