import type { MealSlot } from './meal-slot';

/** Une recette placée à une date et pour un repas. La même recette peut être placée plusieurs fois. */
export interface PlannedMeal {
  id: string;
  recipeId: string;
  /** Date `YYYY-MM-DD`. */
  date: string;
  mealTag: MealSlot;
}
