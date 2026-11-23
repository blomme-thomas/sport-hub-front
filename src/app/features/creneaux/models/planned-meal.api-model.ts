import type { MealSlot } from './meal-slot';

/** Forme JSON d'un repas planifié (contrat : `sport-hub-back`, `GET`/`POST /api/meal-plan`). */
export interface PlannedMealApi {
  id: string;
  recipeId: string;
  date: string;
  mealTag: MealSlot;
}

/** Corps de `POST /api/meal-plan`. */
export interface CreatePlannedMealRequestApi {
  recipeId: string;
  date: string;
  mealTag: MealSlot;
}
