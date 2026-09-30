import { test, expect, Page } from '@playwright/test';

// Light / dark / system switch in the header (desktop) and mobile nav drawer.
// Paths are relative to baseURL in playwright.config.ts.
const MD_POST = '/2022/09/16/data-engineering-in-2022-exploring-lakefs-with-jupyter-and-pyspark/';

const LIGHT_BG = 'rgb(250, 248, 245)'; // #FAF8F5
const DARK_BG = 'rgb(28, 25, 23)';     // #1C1917

const bodyBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const theme = (page: Page) => page.evaluate(() => ({
  theme: document.documentElement.getAttribute('data-theme'),
  pref: document.documentElement.getAttribute('data-theme-pref'),
  stored: localStorage.getItem('theme'),
}));

const desktopSwitch = (page: Page) => page.locator('.site-nav .theme-switch');

test.describe('Theme switch (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('defaults to System, following a light OS', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(desktopSwitch(page)).toBeVisible();
    await expect(desktopSwitch(page).locator('[data-theme-set="system"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await theme(page)).toEqual({ theme: 'light', pref: 'system', stored: null });
    expect(await bodyBg(page)).toBe(LIGHT_BG);
  });

  test('Dark overrides a light OS and persists across pages', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await desktopSwitch(page).locator('[data-theme-set="dark"]').click();
    expect(await theme(page)).toEqual({ theme: 'dark', pref: 'dark', stored: 'dark' });
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);
    await expect(desktopSwitch(page).locator('[data-theme-set="dark"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(desktopSwitch(page).locator('[data-theme-set="system"]')).toHaveAttribute('aria-pressed', 'false');

    await page.goto(MD_POST);
    expect(await theme(page)).toEqual({ theme: 'dark', pref: 'dark', stored: 'dark' });
    expect(await bodyBg(page)).toBe(DARK_BG);
  });

  test('Light overrides a dark OS', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    expect((await theme(page)).theme).toBe('dark');
    await desktopSwitch(page).locator('[data-theme-set="light"]').click();
    expect(await theme(page)).toEqual({ theme: 'light', pref: 'light', stored: 'light' });
    await expect.poll(() => bodyBg(page)).toBe(LIGHT_BG);
  });

  test('saved choice applies before first paint (no flash)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    // With stylesheets blocked, only the inline head script + critical CSS can paint dark.
    await page.route(/\.css(\?|$)/, route => route.abort());
    await page.goto('/');
    const htmlBg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    expect(htmlBg).toBe(DARK_BG);
  });

  test('System clears the saved choice and tracks OS changes live', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('theme', 'dark'); sessionStorage.setItem('seeded', '1'); } });
    await page.goto('/');
    await desktopSwitch(page).locator('[data-theme-set="system"]').click();
    expect(await theme(page)).toEqual({ theme: 'light', pref: 'system', stored: null });

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(async () => (await theme(page)).theme).toBe('dark');
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);

    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(async () => (await theme(page)).theme).toBe('light');
  });

  test('an explicit choice ignores OS changes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await desktopSwitch(page).locator('[data-theme-set="light"]').click();
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);
    expect((await theme(page)).theme).toBe('light');
  });

  test('buttons are labelled for assistive tech', async ({ page }) => {
    await page.goto('/');
    const group = page.getByRole('group', { name: 'Colour theme' }).first();
    await expect(group.getByRole('button', { name: 'Light theme' })).toBeVisible();
    await expect(group.getByRole('button', { name: 'Dark theme' })).toBeVisible();
    await expect(group.getByRole('button', { name: 'Match system setting' })).toBeVisible();
  });

  test('giscus starts on the chosen theme', async ({ page }) => {
    await page.route('https://giscus.app/**', route => route.abort());
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto(MD_POST);
    await expect(page.locator('script[src="https://giscus.app/client.js"]')).toHaveAttribute('data-theme', 'light');
  });

  test('print stays light even when Dark is chosen', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.emulateMedia({ media: 'print' });
    await page.goto('/');
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim());
    expect(bg).toBe('#FAF8F5');
  });
});

test.describe('Theme switch (mobile nav)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('lives in the menu drawer and switches theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(desktopSwitch(page)).toBeHidden();
    await page.locator('.nav-toggle').click();
    const row = page.locator('.mobile-nav .theme-switch-row');
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /Dark/ }).click();
    expect((await theme(page)).theme).toBe('dark');
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);
    await expect(row.locator('[data-theme-set="dark"]')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Theme switch without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('switch is hidden and the page stays light', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.site-nav .theme-switch')).toBeHidden();
    expect(await bodyBg(page)).toBe(LIGHT_BG);
  });
});
