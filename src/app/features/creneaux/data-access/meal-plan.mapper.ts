import type { PlannedMealApi } from '../models/planned-meal.api-model';
import type { PlannedMeal } from '../models/planned-meal.model';

export function toPlannedMeal(api: PlannedMealApi): PlannedMeal {
  return {
    id: api.id,
    recipeId: api.recipeId,
    date: api.date,
    mealTag: api.mealTag,
  };
}
