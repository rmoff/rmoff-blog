import { test, expect } from '@playwright/test';

test('clicking date area in post row navigates to article', async ({ page }) => {
  await page.goto('http://localhost:1313/');
  await page.waitForLoadState('networkidle');

  // Get the URL the first post row's title link points to
  const href = await page.locator('.post-row .post-title-link').first().getAttribute('href');
  expect(href).toBeTruthy();

  // Click at the date's coordinates — the stretched-link ::after should intercept
  const dateBox = await page.locator('.post-row .post-date').first().boundingBox();
  expect(dateBox).toBeTruthy();
  await page.mouse.click(dateBox!.x + dateBox!.width / 2, dateBox!.y + dateBox!.height / 2);

  // Should navigate to the article
  await page.waitForURL(href!, { timeout: 5000 });
});
