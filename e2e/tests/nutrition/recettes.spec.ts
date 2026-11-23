import { expect, test } from '@playwright/test';

const RECIPES_URL = /\/api\/recipes$/;
const RECIPE_URL = /\/api\/recipes\/([^/]+)$/;
const FOODS_URL = /\/api\/foods$/;

const CHICKEN = { id: 'food-chicken', name: 'Poulet (blanc)', unit: 'g', categories: ['proteine'] };
const RICE = { id: 'food-rice', name: 'Riz cuit', unit: 'g', categories: ['feculent'] };

const RECIPE_SUMMARIES = [
  {
    id: 'recipe-chicken',
    name: 'Poulet riz',
    mealTags: ['midi', 'soir'],
    items: [
      { foodId: CHICKEN.id, component: 'proteine', quantity: 150 },
      { foodId: RICE.id, component: 'feculent', quantity: 120 },
    ],
  },
  {
    id: 'recipe-porridge',
    name: 'Porridge banane',
    mealTags: ['matin'],
    items: [{ foodId: RICE.id, component: null, quantity: 40 }],
  },
];

const DETAILS: Record<string, unknown> = {
  'recipe-chicken': {
    ...RECIPE_SUMMARIES[0],
    nutrition: {
      totals: { calories: 437.5, proteins: 52.5, carbohydrates: 40.2, fats: 6.2, sugars: 2.1 },
      byComponent: {
        proteine: { calories: 247.5, proteins: 46.5, carbohydrates: 0, fats: 5.4, sugars: 0 },
        feculent: { calories: 156, proteins: 3.2, carbohydrates: 33.6, fats: 0.4, sugars: 0.1 },
      },
      ignored: [],
    },
  },
  'recipe-porridge': {
    ...RECIPE_SUMMARIES[1],
    nutrition: {
      totals: { calories: 52, proteins: 1.1, carbohydrates: 11.2, fats: 0.1, sugars: 0 },
      byComponent: {
        libre: { calories: 52, proteins: 1.1, carbohydrates: 11.2, fats: 0.1, sugars: 0 },
      },
      ignored: [],
    },
  },
};

test.describe('Mes recettes', () => {
  test('affiche les totaux du back, filtre par repas et consulte une recette', async ({ page }) => {
    await page.route(RECIPES_URL, (route) => route.fulfill({ json: RECIPE_SUMMARIES }));
    await page.route(RECIPE_URL, (route) => {
      const id = RECIPE_URL.exec(route.request().url())?.[1] ?? '';
      return route.fulfill({ json: DETAILS[id] });
    });
    await page.route(FOODS_URL, (route) => route.fulfill({ json: [CHICKEN, RICE] }));

    await page.goto('/nutrition');

    const chicken = page.getByRole('button', { name: 'Ouvrir la recette Poulet riz' });
    await expect(chicken).toContainText('437,5 kcal');
    await expect(chicken).toContainText('52,5 g P');
    await expect(page.getByRole('button', { name: 'Matin (1)' })).toBeVisible();

    await page.getByRole('button', { name: 'Soir (1)' }).click();
    await expect(
      page.getByRole('button', { name: 'Ouvrir la recette Porridge banane' }),
    ).toHaveCount(0);
    await expect(chicken).toBeVisible();

    await chicken.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Poulet riz' })).toBeVisible();
    await expect(dialog.getByText('Poulet (blanc)')).toBeVisible();
    await expect(dialog.getByText('150 g')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Enregistrer' })).toHaveCount(0);
  });
});
