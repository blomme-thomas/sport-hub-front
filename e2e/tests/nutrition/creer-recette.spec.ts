import { expect, test } from '@playwright/test';

const RECIPES_URL = /\/api\/recipes$/;
const RECIPE_URL = /\/api\/recipes\/([^/]+)$/;
const FOODS_URL = /\/api\/foods$/;
const BROCCOLI = {
  id: '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e13',
  name: 'Brocoli',
  unit: 'g',
  categories: ['legume'],
  calories: 34,
  proteins: 2.8,
  carbohydrates: 6.6,
  fats: 0.4,
  sugars: 1.7,
};
const EMPTY_NUTRITION = {
  totals: { calories: 0, proteins: 0, carbohydrates: 0, fats: 0, sugars: 0 },
  byComponent: {},
  ignored: [],
};

test.describe('Créer une recette', () => {
  test('crée une recette dans la modale et la retrouve dans la liste', async ({ page }) => {
    const recipes: Record<string, unknown>[] = [];
    await page.route(RECIPES_URL, (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const created = { id: 'recipe-omelette', ...request.postDataJSON() };
        recipes.push(created);
        return route.fulfill({ status: 201, json: created });
      }
      return route.fulfill({ json: recipes });
    });
    await page.route(RECIPE_URL, (route) => {
      const id = RECIPE_URL.exec(route.request().url())?.[1];
      const recipe = recipes.find((item) => item['id'] === id);
      return route.fulfill({ json: { ...recipe, nutrition: EMPTY_NUTRITION } });
    });
    await page.route(FOODS_URL, (route) => route.fulfill({ json: [BROCCOLI] }));

    await page.goto('/nutrition');
    await page.getByRole('button', { name: 'Nouvelle recette' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nom de la recette', { exact: true }).fill('Omelette épinards');
    await dialog.getByRole('checkbox', { name: 'Matin' }).check();
    const free = dialog.getByRole('group', { name: 'Autre (optionnel)' });
    await free.getByRole('button', { name: 'Ajouter un aliment' }).click();
    await free.getByRole('combobox').selectOption(BROCCOLI.id);

    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && RECIPES_URL.test(request.url()),
    );
    await dialog.getByRole('button', { name: 'Enregistrer' }).click();

    expect((await createRequest).postDataJSON()).toEqual({
      name: 'Omelette épinards',
      mealTags: ['matin'],
      items: [{ foodId: BROCCOLI.id, component: null, quantity: null }],
    });
    await expect(
      page.getByRole('button', { name: 'Ouvrir la recette Omelette épinards' }),
    ).toBeVisible();
  });
});
