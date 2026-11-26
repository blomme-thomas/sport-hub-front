import { expect, test, type Page } from '@playwright/test';
import { CreneauxPage } from '../../pages/creneaux.page';
import { currentWeekDay } from '../../support/week-dates';

const SLOTS_URL = /\/api\/slots(\?.*)?$/;
const SESSIONS_URL = /\/api\/sessions(\?.*)?$/;
const PAUSES_URL = /\/api\/pauses(\?.*)?$/;
const DISCIPLINES_URL = /\/api\/sessions\/disciplines$/;
const MEAL_PLAN_URL = /\/api\/meal-plan(\?.*)?$/;
const MEAL_PLAN_ITEM_URL = /\/api\/meal-plan\/([^/?]+)$/;
const RECIPES_URL = /\/api\/recipes$/;
const RECIPE_URL = /\/api\/recipes\/[^/]+$/;
const FOODS_URL = /\/api\/foods$/;

const CHICKEN = {
  id: '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d01',
  name: 'Poulet riz légumes',
  mealTags: ['midi', 'soir'],
  items: [],
};
const TOTALS = {
  nutrition: {
    totals: { calories: 437.5, proteins: 52.5, carbohydrates: 40.2, fats: 6.2, sugars: 2.1 },
    byComponent: {},
    ignored: [],
  },
};

/** API simulée du calendrier et des recettes ; les repas planifiés vivent dans `meals`. */
async function mockApi(page: Page, meals: Record<string, unknown>[]): Promise<void> {
  await page.route(SLOTS_URL, (route) => route.fulfill({ json: { from: '', to: '', items: [] } }));
  await page.route(SESSIONS_URL, (route) => route.fulfill({ json: { items: [] } }));
  await page.route(PAUSES_URL, (route) => route.fulfill({ json: [] }));
  await page.route(DISCIPLINES_URL, (route) => route.fulfill({ json: { items: [] } }));
  await page.route(RECIPES_URL, (route) => route.fulfill({ json: [CHICKEN] }));
  await page.route(RECIPE_URL, (route) => route.fulfill({ json: { ...CHICKEN, ...TOTALS } }));
  await page.route(FOODS_URL, (route) => route.fulfill({ json: [] }));
  await page.route(MEAL_PLAN_ITEM_URL, (route) => {
    const id = MEAL_PLAN_ITEM_URL.exec(route.request().url())?.[1];
    const index = meals.findIndex((meal) => meal['id'] === id);
    if (index >= 0) {
      meals.splice(index, 1);
    }
    return route.fulfill({ status: 204, body: '' });
  });
  await page.route(MEAL_PLAN_URL, (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const created = { id: `meal-${meals.length + 1}`, ...request.postDataJSON() };
      meals.push(created);
      return route.fulfill({ status: 201, json: created });
    }
    return route.fulfill({ json: meals });
  });
}

test.describe('Calendrier alimentation : placer des recettes', () => {
  test('glisse une recette dans une case, consulte le repas placé et le retire', async ({
    page,
  }) => {
    const meals: Record<string, unknown>[] = [];
    await mockApi(page, meals);

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Alimentation', exact: true }).click();

    const chip = page.getByText('Poulet riz légumes', { exact: true });
    const grid = page.getByRole('table', { name: 'Repas de la semaine' });
    const monday = grid
      .getByRole('rowheader', { name: 'Midi' })
      .locator('xpath=..')
      .getByRole('cell')
      .first();

    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && MEAL_PLAN_URL.test(request.url()),
    );
    await chip.dragTo(monday);

    expect((await createRequest).postDataJSON()).toEqual({
      recipeId: CHICKEN.id,
      date: currentWeekDay(0),
      mealTag: 'midi',
    });
    const placed = monday.getByRole('button', { name: 'Ouvrir Poulet riz légumes' });
    await expect(placed).toBeVisible();

    await placed.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('437,5')).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Aliments' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await monday.getByRole('button', { name: 'Retirer Poulet riz légumes du planning' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(monday.getByRole('button', { name: 'Ouvrir Poulet riz légumes' })).toHaveCount(0);
  });
});

test.describe('Calendrier alimentation sur mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('désactive le placement et garde la consultation', async ({ page }) => {
    await mockApi(page, []);

    const calendrier = new CreneauxPage(page);
    await calendrier.goto();
    await page.getByRole('button', { name: 'Alimentation', exact: true }).click();

    await expect(
      page.getByText(
        'Le placement se fait sur ordinateur. Vous pouvez consulter une recette placée.',
      ),
    ).toBeVisible();
    await expect(
      page.locator('li.recipe-library__card', { hasText: 'Poulet riz légumes' }),
    ).toHaveAttribute('draggable', 'false');
  });
});
