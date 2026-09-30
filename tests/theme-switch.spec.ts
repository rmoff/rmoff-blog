import { test, expect, Page } from '@playwright/test';

// Light / dark / system theme control: a compact icon + menu in the desktop
// header, a labelled segmented row in the mobile nav drawer.
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

const menuButton = (page: Page) => page.locator('.site-nav .theme-menu-button');
const menu = (page: Page) => page.locator('#theme-menu-list');
async function choose(page: Page, pref: 'light' | 'dark' | 'system') {
  await menuButton(page).click();
  await menu(page).locator(`[data-theme-set="${pref}"]`).click();
}

test.describe('Theme switch (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('defaults to System, following a light OS', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(menuButton(page)).toBeVisible();
    await expect(menuButton(page)).toHaveAttribute('aria-label', 'Theme: System');
    await expect(menu(page)).toBeHidden();
    await expect(menu(page).locator('[data-theme-set="system"]')).toHaveAttribute('aria-checked', 'true');
    expect(await theme(page)).toEqual({ theme: 'light', pref: 'system', stored: null });
    expect(await bodyBg(page)).toBe(LIGHT_BG);
  });

  test('Dark overrides a light OS and persists across pages', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await choose(page, 'dark');
    expect(await theme(page)).toEqual({ theme: 'dark', pref: 'dark', stored: 'dark' });
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);
    await expect(menu(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-label', 'Theme: Dark');
    await expect(menu(page).locator('[data-theme-set="dark"]')).toHaveAttribute('aria-checked', 'true');
    await expect(menu(page).locator('[data-theme-set="system"]')).toHaveAttribute('aria-checked', 'false');

    await page.goto(MD_POST);
    expect(await theme(page)).toEqual({ theme: 'dark', pref: 'dark', stored: 'dark' });
    expect(await bodyBg(page)).toBe(DARK_BG);
  });

  test('Light overrides a dark OS', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    expect((await theme(page)).theme).toBe('dark');
    await choose(page, 'light');
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
    await choose(page, 'system');
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
    await choose(page, 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);
    expect((await theme(page)).theme).toBe('light');
  });

  test('header takes one icon, showing the current choice', async ({ page }) => {
    await page.goto('/');
    const visibleIcons = () => page.locator('.theme-menu-button .theme-menu-icon:visible');
    await expect(visibleIcons()).toHaveCount(1);
    await expect(visibleIcons()).toHaveAttribute('data-theme-icon', 'system');
    await choose(page, 'dark');
    await expect(visibleIcons()).toHaveCount(1);
    await expect(visibleIcons()).toHaveAttribute('data-theme-icon', 'dark');
  });

  test('menu is keyboard operable and labelled for assistive tech', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Theme: System' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const m = page.getByRole('menu', { name: 'Theme' });
    await expect(m.getByRole('menuitemradio')).toHaveCount(3);
    // Focus starts on the current choice (System), wraps with arrows.
    await expect(m.getByRole('menuitemradio', { name: 'System' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(m.getByRole('menuitemradio', { name: 'Light' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(m.getByRole('menuitemradio', { name: 'Dark' })).toBeFocused();
    await page.keyboard.press('Enter');
    expect((await theme(page)).pref).toBe('dark');
    await expect(m).toBeHidden();
    await expect(page.getByRole('button', { name: 'Theme: Dark' })).toBeFocused();
    // Escape closes without changing anything.
    await page.keyboard.press('ArrowDown');
    await expect(m).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(m).toBeHidden();
    expect((await theme(page)).pref).toBe('dark');
  });

  test('clicking outside closes the menu', async ({ page }) => {
    await page.goto('/');
    await menuButton(page).click();
    await expect(menu(page)).toBeVisible();
    const url = page.url();
    // Empty header space between the title and the nav.
    const x = await page.evaluate(() =>
      (document.querySelector('.site-title')!.getBoundingClientRect().right +
       document.querySelector('.site-nav')!.getBoundingClientRect().left) / 2);
    await page.mouse.click(x, 30);
    await expect(menu(page)).toBeHidden();
    expect(page.url()).toBe(url); // closed by the click handler, not a navigation
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
    await expect(menuButton(page)).toBeHidden();
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
    await expect(page.locator('.site-nav .theme-menu')).toBeHidden();
    expect(await bodyBg(page)).toBe(LIGHT_BG);
  });
});
