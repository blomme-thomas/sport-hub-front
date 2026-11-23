import type { PlannedMealApi } from '../../app/features/creneaux/models/planned-meal.api-model';

/** Repas planifiés de test, dans la semaine ISO 2026-W12 (lundi 16 mars 2026). */
export const mealPlanFixtures: PlannedMealApi[] = [
  {
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    recipeId: '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d01',
    date: '2026-03-17',
    mealTag: 'midi',
  },
  {
    id: 'a1b2c3d4-0000-4000-8000-000000000002',
    recipeId: '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d01',
    date: '2026-03-17',
    mealTag: 'midi',
  },
];
