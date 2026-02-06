import { test, expect } from '@playwright/test';

test.describe('Header UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1313/');
  });

  test('talks icon is in social icons row', async ({ page }) => {
    const talksIcon = page.locator('.header-icons .icon-link', { has: page.locator('i.fa-chalkboard') });
    await expect(talksIcon).toBeVisible();

    const label = talksIcon.locator('.icon-label');
    await expect(label).toHaveText('talks');
  });

  test('youtube icon appears before talks icon', async ({ page }) => {
    const icons = page.locator('.header-icons .icon-link');
    const labels = await icons.locator('.icon-label').allTextContents();

    const talksIndex = labels.indexOf('talks');
    const youtubeIndex = labels.indexOf('youtube');

    expect(talksIndex).toBeGreaterThan(-1);
    expect(youtubeIndex).toBeGreaterThan(-1);
    expect(youtubeIndex).toBeLessThan(talksIndex);
  });

  test('icon label appears on hover', async ({ page }) => {
    const githubIcon = page.locator('.header-icons .icon-link', { has: page.locator('.fa-github-square') });
    const label = githubIcon.locator('.icon-label');

    // Label should be hidden initially
    await expect(label).toHaveCSS('opacity', '0');

    // Hover over icon
    await githubIcon.hover();

    // Label should be visible
    await expect(label).toHaveCSS('opacity', '1');
    await expect(label).toHaveText('github');
  });

  test('header content box is width-constrained', async ({ page }) => {
    const headerContent = page.locator('.glass-header-content');
    await expect(headerContent).toBeVisible();

    const box = await headerContent.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(800);
  });

  test('header icons row is width-constrained', async ({ page }) => {
    const iconsRow = page.locator('.header-icons-row');
    await expect(iconsRow).toBeVisible();

    const box = await iconsRow.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(800);
  });

  test('header is centered on wide viewport', async ({ page }) => {
    // Set wide viewport
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('http://localhost:1313/');

    const headerContent = page.locator('.glass-header-content');
    const box = await headerContent.boundingBox();
    expect(box).not.toBeNull();

    // Check it's roughly centered (viewport 1400px, content max 800px, so ~300px margin each side)
    const leftMargin = box!.x;
    const rightMargin = 1400 - (box!.x + box!.width);

    // Allow some tolerance for padding/borders
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(50);
  });
});
