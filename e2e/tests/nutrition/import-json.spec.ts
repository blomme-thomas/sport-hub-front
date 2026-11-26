import { expect, test, type Locator, type Page } from '@playwright/test';

const FOODS_URL = /\/api\/foods$/;
const FOODS_IMPORT_URL = /\/api\/foods\/import$/;
const RECIPES_URL = /\/api\/recipes$/;
const RECIPES_IMPORT_URL = /\/api\/recipes\/import$/;
const RECIPE_URL = /\/api\/recipes\/(?!import$)([^/]+)$/;

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

const EMPTY_NUTRITION = {
  totals: { calories: 0, proteins: 0, carbohydrates: 0, fats: 0, sugars: 0 },
  byComponent: {},
  ignored: [],
};

const FOODS_FILE = JSON.stringify({
  kind: 'plan-aliments',
  schemaVersion: 1,
  aliments: [{ name: 'Poulet cuit', unit: 'g', categories: ['proteine'], calories: 165 }],
});

const RECIPES_FILE = JSON.stringify({
  kind: 'plan-recettes',
  schemaVersion: 1,
  recettes: [
    {
      name: 'Riz au poulet',
      mealTags: ['midi'],
      items: [{ food: 'Riz cuit', component: 'feculent', quantity: 80 }],
    },
  ],
});

/** Dépose un fichier JSON dans la zone de la boîte de dialogue ouverte. */
async function dropFile(dialog: Locator, content: string): Promise<void> {
  const zone = dialog.getByRole('group', { name: /Fichier \(\.json\)/ });
  const dataTransfer = await zone.evaluateHandle((_, text) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([text], 'import.json', { type: 'application/json' }));
    return transfer;
  }, content);
  await zone.dispatchEvent('drop', { dataTransfer });
}

async function mockFoods(page: Page, foods: Record<string, unknown>[]): Promise<void> {
  await page.route(FOODS_URL, (route) => route.fulfill({ json: foods }));
}

test.describe('Import JSON de la base alimentaire', () => {
  test('importe un fichier d’aliments et les affiche dans la liste', async ({ page }) => {
    const foods: Record<string, unknown>[] = [RICE];
    let importedBody: unknown = null;
    await mockFoods(page, foods);
    await page.route(FOODS_IMPORT_URL, (route) => {
      importedBody = route.request().postDataJSON();
      foods.push({ id: 'food-poulet', name: 'Poulet cuit', unit: 'g', categories: ['proteine'] });
      return route.fulfill({
        status: 201,
        json: { createdCount: 1, ids: ['food-poulet'] },
      });
    });

    await page.goto('/nutrition?onglet=aliments');
    await expect(page.getByRole('rowheader', { name: /Riz cuit/ })).toBeVisible();

    await page.getByRole('button', { name: 'Importer (JSON)' }).click();
    const dialog = page.getByRole('dialog');
    await dropFile(dialog, FOODS_FILE);
    await expect(dialog.getByText('1 élément(s) détecté(s) dans le fichier.')).toBeVisible();

    await dialog.getByRole('button', { name: 'Importer', exact: true }).click();

    expect(importedBody).toEqual(JSON.parse(FOODS_FILE));
    await expect(page.getByText('1 aliment(s) importé(s).')).toBeVisible();
    await expect(page.getByRole('rowheader', { name: /Poulet cuit/ })).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('garde la modale ouverte et affiche le doublon renvoyé par le back', async ({ page }) => {
    await mockFoods(page, [RICE]);
    await page.route(FOODS_IMPORT_URL, (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/problem+json',
        json: {
          type: 'urn:sport-hub:problem:food-import-duplicate',
          title: 'Conflict',
          status: 409,
          detail: 'Import refusé : un aliment porte déjà ce nom.',
          code: 'FOOD_IMPORT_DUPLICATE',
          errors: [
            {
              field: 'aliments[0].name',
              code: 'FOOD_IMPORT_DUPLICATE',
              message: 'un aliment porte déjà ce nom',
            },
          ],
        },
      }),
    );

    await page.goto('/nutrition?onglet=aliments');
    await page.getByRole('button', { name: 'Importer (JSON)' }).click();
    const dialog = page.getByRole('dialog');
    await dropFile(dialog, FOODS_FILE);
    await dialog.getByRole('button', { name: 'Importer', exact: true }).click();

    await expect(dialog.getByRole('alert')).toContainText('aliments[0].name');
    await expect(dialog).toBeVisible();
  });

  test('importe un fichier de recettes qui désigne ses aliments par nom', async ({ page }) => {
    const recipes: Record<string, unknown>[] = [];
    let importedBody: unknown = null;
    await mockFoods(page, [RICE]);
    await page.route(RECIPES_URL, (route) => route.fulfill({ json: recipes }));
    await page.route(RECIPE_URL, (route) => {
      const id = RECIPE_URL.exec(route.request().url())?.[1];
      const recipe = recipes.find((item) => item['id'] === id);
      return route.fulfill({ json: { ...recipe, nutrition: EMPTY_NUTRITION } });
    });
    await page.route(RECIPES_IMPORT_URL, (route) => {
      importedBody = route.request().postDataJSON();
      recipes.push({
        id: 'recipe-riz-poulet',
        name: 'Riz au poulet',
        mealTags: ['midi'],
        items: [],
      });
      return route.fulfill({
        status: 201,
        json: { createdCount: 1, ids: ['recipe-riz-poulet'] },
      });
    });

    await page.goto('/nutrition');
    await page.getByRole('button', { name: 'Importer (JSON)' }).click();
    const dialog = page.getByRole('dialog');
    await dropFile(dialog, RECIPES_FILE);
    await dialog.getByRole('button', { name: 'Importer', exact: true }).click();

    expect(importedBody).toEqual(JSON.parse(RECIPES_FILE));
    await expect(page.getByText('1 recette(s) importée(s).')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Riz au poulet' })).toBeVisible();
  });
});
