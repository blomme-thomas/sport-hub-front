import { expect, test } from '@playwright/test';
import { NutritionPage } from '../../pages/nutrition.page';

const FOODS_URL = /\/api\/foods$/;

const RICE = {
  id: '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e12',
  name: 'Riz cuit',
  unit: 'g',
  categories: ['feculent'],
  calories: 130,
  proteins: 2.7,
  carbohydrates: 28,
  fats: 0.3,
  sugars: 0.1,
};

test.describe('Base alimentaire', () => {
  test('ajoute un aliment depuis l’onglet Mes aliments', async ({ page }) => {
    const foods: Record<string, unknown>[] = [RICE];
    await page.route(FOODS_URL, (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const created = { id: 'food-quinoa', ...request.postDataJSON() };
        foods.push(created);
        return route.fulfill({ status: 201, json: created });
      }
      return route.fulfill({ json: foods });
    });

    const nutrition = new NutritionPage(page);
    await page.goto('/nutrition?onglet=aliments');
    await expect(nutrition.foodsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('rowheader', { name: /Riz cuit/ })).toBeVisible();

    await page.getByRole('button', { name: 'Ajouter un aliment' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nom', { exact: true }).fill('Quinoa cuit');
    await dialog.getByLabel('Unité', { exact: true }).fill('g');
    await dialog.getByRole('checkbox', { name: 'Féculents' }).check();
    await dialog.getByLabel('Glucides (g)').fill('21.3');

    const createRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && FOODS_URL.test(request.url()),
    );
    await dialog.getByRole('button', { name: 'Enregistrer' }).click();

    expect((await createRequest).postDataJSON()).toEqual({
      name: 'Quinoa cuit',
      unit: 'g',
      categories: ['feculent'],
      calories: null,
      proteins: null,
      carbohydrates: 21.3,
      fats: null,
      sugars: null,
    });
    await expect(page.getByRole('rowheader', { name: /Quinoa cuit/ })).toBeVisible();
  });

  test('filtre la base par catégorie et par recherche', async ({ page }) => {
    await page.route(FOODS_URL, (route) =>
      route.fulfill({
        json: [RICE, { ...RICE, id: 'food-brocoli', name: 'Brocoli', categories: ['legume'] }],
      }),
    );

    await page.goto('/nutrition?onglet=aliments');
    await page.getByRole('button', { name: 'Légumes (1)' }).click();

    await expect(page.getByRole('rowheader', { name: /Brocoli/ })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: /Riz cuit/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Tous (2)' }).click();
    await page.getByRole('searchbox').fill('riz');

    await expect(page.getByRole('rowheader', { name: /Riz cuit/ })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: /Brocoli/ })).toHaveCount(0);
  });
});
