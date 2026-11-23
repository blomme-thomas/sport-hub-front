import { expect, test, type Page } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';
import { currentWeekDay } from '../../support/week-dates';

const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const PAUSES_URL = /\/api\/pauses(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;
const MEAL_PLAN_URL = /\/api\/meal-plan(\?.*)?$/;
const RECIPES_URL = /\/api\/recipes$/;
const SHOPPING_URL = /\/api\/shopping-list(\?.*)?$/;

const SHOPPING_LIST = [
  {
    foodId: 'food-chicken',
    name: 'Poulet (blanc)',
    unit: 'g',
    category: 'proteine',
    quantity: 300,
    quantityMissing: false,
  },
  {
    foodId: 'food-curry',
    name: 'Épices (curry)',
    unit: 'g',
    category: 'autre',
    quantity: null,
    quantityMissing: true,
  },
];

async function mockApi(page: Page): Promise<void> {
  await page.route(SLOTS_URL, (route) => route.fulfill({ json: { from: '', to: '', items: [] } }));
  await page.route(SESSIONS_URL, (route) => route.fulfill({ json: { items: [] } }));
  await page.route(PAUSES_URL, (route) => route.fulfill({ json: [] }));
  await page.route(DISCIPLINES_URL, (route) => route.fulfill({ json: { items: [] } }));
  await page.route(RECIPES_URL, (route) => route.fulfill({ json: [] }));
  await page.route(MEAL_PLAN_URL, (route) => route.fulfill({ json: [] }));
  await page.route(SHOPPING_URL, (route) => route.fulfill({ json: SHOPPING_LIST }));
}

test.describe('Calendrier alimentation : liste de courses', () => {
  test('choisit une période au glisser, génère la liste et la copie', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://localhost:4200',
    });
    await mockApi(page);

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Alimentation', exact: true }).click();

    const grid = page.getByRole('table', { name: 'Repas de la semaine' });
    const lundi = grid.getByRole('columnheader').nth(1);
    const mercredi = grid.getByRole('columnheader').nth(3);
    await lundi.hover();
    await page.mouse.down();
    await mercredi.hover();
    await page.mouse.up();

    await expect(page.getByText(/Période choisie : du lundi/)).toBeVisible();

    const shoppingRequest = page.waitForRequest(
      (request) => SHOPPING_URL.test(request.url()) && request.method() === 'GET',
    );
    await page.getByRole('button', { name: 'Générer une liste de courses' }).click();

    const url = new URL((await shoppingRequest).url());
    expect(url.searchParams.get('from')).toBe(currentWeekDay(0));
    expect(url.searchParams.get('to')).toBe(currentWeekDay(2));

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('region', { name: 'Protéines' })).toContainText('Poulet (blanc)');
    await expect(dialog.getByRole('region', { name: 'Autres' })).toContainText(
      'quantité à compléter',
    );

    await dialog.getByRole('button', { name: 'Copier', exact: true }).click();

    await expect(page.getByText('Liste copiée.')).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Liste de courses');
    expect(copied).toContain('- Poulet (blanc) : 300 g');
  });
});
