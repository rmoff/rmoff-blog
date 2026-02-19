import { test, expect } from '@playwright/test';
import path from 'path';

const articleUrl = '/2026/02/18/building-a-data-pipeline-with-dbt-and-duckdb/';
const screenshotDir = path.resolve(__dirname, '..', 'test-results');

test.describe('AsciiDoc code callout lists', () => {
  test('callout list renders as clean annotations, not a bordered table', async ({ page }) => {
    await page.goto(articleUrl, { waitUntil: 'networkidle' });

    const colistDiv = page.locator('.colist').first();
    await expect(colistDiv).toBeVisible();

    // Screenshot the callout list element
    await colistDiv.scrollIntoViewIfNeeded();
    await colistDiv.screenshot({
      path: path.join(screenshotDir, 'callout-list-first.png'),
    });

    // Table cells should have no borders
    const firstTd = colistDiv.locator('td').first();
    const tdBorder = await firstTd.evaluate((el) => getComputedStyle(el).borderWidth);
    expect(tdBorder).toBe('0px');

    // Table should not stretch to full width
    const colistTable = colistDiv.locator('table').first();
    const tableWidth = await colistTable.evaluate((el) => parseFloat(getComputedStyle(el).width));
    const parentWidth = await colistTable.evaluate((el) => parseFloat(getComputedStyle(el.parentElement!).width));
    expect(tableWidth).toBeLessThan(parentWidth);

    // Conum badges should be circular with dark bg and white text
    const conum = colistDiv.locator('.conum[data-value]').first();
    await expect(conum).toBeVisible();
    const styles = await conum.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        borderRadius: s.borderRadius,
        backgroundColor: s.backgroundColor,
        color: s.color,
        display: s.display,
      };
    });
    expect(styles.borderRadius).toBe('50%');
    expect(styles.backgroundColor).toBe('rgb(232, 66, 30)');  // Brand accent #E8421E
    expect(styles.color).toBe('rgb(255, 255, 255)');
    expect(styles.display).toBe('inline-flex');

    // Redundant bold text next to conum should be hidden
    const boldSibling = colistDiv.locator('.conum[data-value] + b').first();
    await expect(boldSibling).toBeHidden();
  });

  test('all callout lists on the page have no borders', async ({ page }) => {
    await page.goto(articleUrl, { waitUntil: 'networkidle' });

    const colists = page.locator('.colist');
    const count = await colists.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const colist = colists.nth(i);
      await colist.scrollIntoViewIfNeeded();

      // Screenshot each one
      await colist.screenshot({
        path: path.join(screenshotDir, `callout-list-${i + 1}.png`),
      });

      // Every callout list td should have no border
      const td = colist.locator('td').first();
      const border = await td.evaluate((el) => getComputedStyle(el).borderWidth);
      expect(border, `callout list ${i + 1} td should have no border`).toBe('0px');
    }
  });

  test('admonition blocks still render correctly', async ({ page }) => {
    await page.goto(
      '/2022/10/20/data-engineering-in-2022-exploring-dbt-with-duckdb/',
      { waitUntil: 'networkidle' }
    );

    const admonition = page.locator('.admonitionblock').first();
    if ((await admonition.count()) > 0) {
      await admonition.scrollIntoViewIfNeeded();
      await admonition.screenshot({
        path: path.join(screenshotDir, 'admonition-block.png'),
      });

      const admonitionTable = admonition.locator('table').first();
      const borderLeft = await admonitionTable.evaluate((el) =>
        getComputedStyle(el).borderLeftWidth
      );
      expect(parseFloat(borderLeft)).toBeGreaterThan(0);
    }
  });
});
