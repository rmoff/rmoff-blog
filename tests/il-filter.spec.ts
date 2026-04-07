import { test, expect } from '@playwright/test';

const IL_URL = 'http://localhost:1313/2026/01/20/interesting-links-january-2026/';

// The checkbox is visually hidden behind a custom toggle switch,
// so we click the label instead of calling .check() on the input.
async function toggleFireFilter(page) {
  await page.locator('#il-fire-toggle').click();
  await page.waitForTimeout(100);
}

test.describe('IL Filter', () => {

  test('toolbar is rendered on IL page', async ({ page }) => {
    await page.goto(IL_URL);
    const toolbar = page.locator('.il-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(page.locator('#il-fire-cb')).toBeAttached();
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

  test('?top query parameter activates filter on load', async ({ page }) => {
    await page.goto(IL_URL + '?top');
    await page.waitForSelector('.il-toolbar');

    const cb = page.locator('#il-fire-cb');
    await expect(cb).toBeChecked();

    const hiddenItems = page.locator('[data-il-section="true"] .sectionbody li.il-hidden');
    expect(await hiddenItems.count()).toBeGreaterThan(0);
  });

  test('toggling filter updates URL query parameter', async ({ page }) => {
    await page.goto(IL_URL);
    await page.waitForSelector('.il-toolbar');

    // URL should not have ?top initially
    expect(new URL(page.url()).searchParams.has('top')).toBe(false);

    // Enable filter — URL should gain ?top
    await toggleFireFilter(page);
    expect(new URL(page.url()).searchParams.has('top')).toBe(true);

    // Disable filter — ?top should be removed
    await toggleFireFilter(page);
    expect(new URL(page.url()).searchParams.has('top')).toBe(false);
  });

  test('admonition/quote list items are not hidden by fire filter', async ({ page }) => {
    // March 2026 post has a TIP admonition with a list inside "Big Picture & Culture"
    const MARCH_URL = 'http://localhost:1313/2026/03/25/interesting-links-march-2026/';
    await page.goto(MARCH_URL);
    await page.waitForSelector('.il-toolbar');

    // Find list items inside admonition blocks before filtering
    const admonitionItems = page.locator('[data-il-section="true"] .admonitionblock li');
    const admonitionCount = await admonitionItems.count();
    expect(admonitionCount).toBeGreaterThan(0);

    await toggleFireFilter(page);

    // Admonition list items should NOT have il-hidden class
    const hiddenAdmonitionItems = page.locator('[data-il-section="true"] .admonitionblock li.il-hidden');
    expect(await hiddenAdmonitionItems.count()).toBe(0);

    // But regular link items should still be filtered
    const hiddenItems = page.locator('[data-il-section="true"] li.il-hidden');
    expect(await hiddenItems.count()).toBeGreaterThan(0);
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
