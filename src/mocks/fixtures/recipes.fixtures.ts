import type {
  RecipeApi,
  RecipeDetailApi,
} from '../../app/features/nutrition/models/recipe.api-model';

const CHICKEN = '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e10';
const SALMON = '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e11';
const RICE = '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e12';
const BROCCOLI = '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e13';
const LENTILS = '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e14';
const SPICES = '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e15';

/** Recettes au format `GET /api/recipes` : triées par nom, sans synthèse. */
export const recipesFixtures: RecipeApi[] = [
  {
    id: '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d01',
    name: 'Poulet riz légumes',
    mealTags: ['midi', 'soir'],
    items: [
      { foodId: CHICKEN, component: 'proteine', quantity: 150 },
      { foodId: RICE, component: 'feculent', quantity: 120 },
      { foodId: BROCCOLI, component: 'legume', quantity: 100 },
    ],
  },
  {
    id: '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d02',
    name: 'Salade lentilles',
    mealTags: ['midi'],
    items: [
      { foodId: LENTILS, component: 'proteine', quantity: 200 },
      { foodId: BROCCOLI, component: 'legume', quantity: 80 },
    ],
  },
  {
    id: '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d03',
    name: 'Saumon riz',
    mealTags: ['soir'],
    items: [
      { foodId: SALMON, component: 'proteine', quantity: 150 },
      { foodId: RICE, component: 'feculent', quantity: 100 },
      { foodId: SPICES, component: null, quantity: null },
    ],
  },
];

/** Synthèses calculées par le back (valeurs arrondies pour les fixtures). */
const nutritionById: Record<string, RecipeDetailApi['nutrition']> = {
  '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d01': {
    totals: { calories: 437.5, proteins: 52.5, carbohydrates: 40.2, fats: 6.2, sugars: 2.1 },
    byComponent: {
      proteine: { calories: 247.5, proteins: 46.5, carbohydrates: 0, fats: 5.4, sugars: 0 },
      feculent: { calories: 156, proteins: 3.2, carbohydrates: 33.6, fats: 0.4, sugars: 0.1 },
      legume: { calories: 34, proteins: 2.8, carbohydrates: 6.6, fats: 0.4, sugars: 1.7 },
    },
    ignored: [],
  },
  '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d02': {
    totals: { calories: 259.2, proteins: 20.2, carbohydrates: 45.3, fats: 1.1, sugars: 5 },
    byComponent: {
      proteine: { calories: 232, proteins: 18, carbohydrates: 40, fats: 0.8, sugars: 3.6 },
      legume: { calories: 27.2, proteins: 2.2, carbohydrates: 5.3, fats: 0.3, sugars: 1.4 },
    },
    ignored: [],
  },
  '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d03': {
    totals: { calories: 442, proteins: 40.2, carbohydrates: 28, fats: 18.3, sugars: 0.1 },
    byComponent: {
      proteine: { calories: 312, proteins: 37.5, carbohydrates: 0, fats: 18, sugars: 0 },
      feculent: { calories: 130, proteins: 2.7, carbohydrates: 28, fats: 0.3, sugars: 0.1 },
      libre: { calories: 0, proteins: 0, carbohydrates: 0, fats: 0, sugars: 0 },
    },
    ignored: [{ foodId: SPICES, reason: 'quantity-missing' }],
  },
};

/** Détails au format `GET /api/recipes/:id`. */
export const recipeDetailFixtures: RecipeDetailApi[] = recipesFixtures.map((recipe) => ({
  ...recipe,
  nutrition: nutritionById[recipe.id]!,
}));
