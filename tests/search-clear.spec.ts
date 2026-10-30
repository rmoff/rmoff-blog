import { test, expect, type Page } from '@playwright/test';

// Needs a full build with a Pagefind index (see search.spec.ts).

// Holds matching Pagefind requests back until release() is called, so a search
// can be kept in flight for as long as a test needs. hold(false) lets new
// requests through while the ones already held stay held.
async function gate(page: Page, pattern: string) {
  const held: Route[] = [];
  let holding = true;
  await page.route(pattern, route => {
    if (holding) held.push(route);
    else route.continue();
  });
  return {
    hold: (on: boolean) => { holding = on; },
    heldCount: () => held.length,
    release: async () => {
      holding = false;
      await Promise.all(held.splice(0).map(r => r.continue()));
    },
  };
}

// Opens /search/ and waits for Pagefind's filter data. Without it a search returns
// no category counts, so a test on the category chips would pass or fail by luck.
async function openSearchWithFilters(page: Page) {
  const filters = page.waitForResponse('**/pagefind/filter/**');
  await page.goto('/search/');
  await filters;
  await expect(page.locator('.pagefind-ui__search-input')).toBeFocused();
}

// Beats both debounces (150ms results, 200ms categories) on the page's own clock,
// so a slow machine can't end the wait before they have fired.
function pastDebounces(page: Page) {
  return page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));
}

// Returns once a search for `term` that should have been dropped has had its chance
// to render. A fixed wait can end first on a loaded machine and pass by accident, so
// this runs the same search in the page: it shares Pagefind's loaded data and queues
// behind the stalled search, so that search has finished by the time this one does.
// A string, so Playwright's compiler leaves the dynamic import alone.
async function searchSettled(page: Page, term: string) {
  await pastDebounces(page);
  await page.evaluate(`(async () => {
    const pagefind = await import('/pagefind/pagefind.js');
    const search = await pagefind.search(${JSON.stringify(term)});
    await Promise.all(search.results.slice(0, 10).map(r => r.data()));
    await new Promise(resolve => setTimeout(resolve));
  })()`);
}

test.describe('Search Clear', () => {
  test.describe('Clear button', () => {
    async function expectCleared(page: Page) {
      await expect(page.locator('.pagefind-ui__search-input')).toHaveValue('');
      await expect(page.locator('#custom-results')).toBeEmpty();
      await expect(page.locator('#category-results')).toBeEmpty();
      await expect(page.locator('#search-suggestions')).toBeVisible();
      expect(new URL(page.url()).searchParams.has('q')).toBe(false);
    }

    test('clears results, category chips and ?q, and keeps the cursor in the box', async ({ page }) => {
      await openSearchWithFilters(page);
      await page.locator('.pagefind-ui__search-input').fill('Flink');
      await expect(page.locator('.cr-result').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#category-results a').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#search-suggestions')).toBeHidden();
      await expect(page).toHaveURL(/q=Flink/);

      await page.locator('.pagefind-ui__search-clear').click();

      await expectCleared(page);
      await expect(page.locator('.pagefind-ui__search-input')).toBeFocused();

      // Refreshing must not bring the search back
      await page.reload();
      await expect(page.locator('.pagefind-ui__search-input')).toBeVisible();
      await searchSettled(page, 'Flink');
      await expectCleared(page);
    });

    test('keeps the chosen sort, as deleting the text by hand does', async ({ page }) => {
      await page.goto('/search/?q=Flink&sort=newest');
      await expect(page.locator('.cr-result').first()).toBeVisible({ timeout: 5000 });

      await page.locator('.pagefind-ui__search-clear').click();

      await expectCleared(page);
      expect(new URL(page.url()).search).toBe('?sort=newest');

      await page.locator('.pagefind-ui__search-input').fill('kafka');
      await expect(page.locator('.search-sort-btn[data-sort="newest"]')).toHaveClass(/active/, { timeout: 5000 });
      await expect(page).toHaveURL(/q=kafka/);
      await expect(page).toHaveURL(/sort=newest/);
    });

    test('cancels a search still waiting on its debounce', async ({ page }) => {
      await openSearchWithFilters(page);

      // Same task, so Clear lands inside the debounce whatever the machine's speed
      await page.evaluate(async () => {
        const input = document.querySelector<HTMLInputElement>('.pagefind-ui__search-input')!;
        input.value = 'Flink';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await Promise.resolve(); // Lets PagefindUI reveal the Clear button
        document.querySelector<HTMLButtonElement>('.pagefind-ui__search-clear')!.click();
      });

      await searchSettled(page, 'Flink');
      await expectCleared(page);
    });

    test('drops results and category chips from a search already in flight', async ({ page }) => {
      await openSearchWithFilters(page);

      // Both searches need this before they can return, so both stall here
      const index = await gate(page, '**/pagefind/index/**');
      await page.locator('.pagefind-ui__search-input').fill('Flink');
      await expect.poll(index.heldCount).toBeGreaterThan(0);
      await pastDebounces(page);

      await page.locator('.pagefind-ui__search-clear').click();
      await index.release();

      await searchSettled(page, 'Flink');
      await expectCleared(page);
    });

    test('drops results from a search that is fetching its result data', async ({ page }) => {
      await openSearchWithFilters(page);

      const fragments = await gate(page, '**/pagefind/fragment/**');
      await page.locator('.pagefind-ui__search-input').fill('Flink');
      await expect.poll(fragments.heldCount).toBeGreaterThan(0);

      await page.locator('.pagefind-ui__search-clear').click();
      await fragments.release();

      await searchSettled(page, 'Flink');
      await expectCleared(page);
    });
  });

  test('an older search finishing late does not replace a newer one', async ({ page }) => {
    await page.goto('/search/');
    const searchInput = page.locator('.pagefind-ui__search-input');
    await expect(searchInput).toBeFocused();

    // Two terms with no posts in common, so they share no result data
    const fragments = await gate(page, '**/pagefind/fragment/**');
    await searchInput.fill('flink');
    await expect.poll(fragments.heldCount).toBeGreaterThan(0);

    fragments.hold(false);
    await searchInput.fill('obiee');
    await expect(page.locator('.cr-message')).toContainText('results for obiee', { timeout: 5000 });

    await fragments.release();
    await searchSettled(page, 'flink');
    await expect(page.locator('.cr-message')).toContainText('results for obiee');
  });
});
