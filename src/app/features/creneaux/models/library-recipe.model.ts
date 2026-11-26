import type { MealSlot } from './meal-slot';

/** Recette de la bibliothèque du calendrier : ce qu'il faut pour la nommer, la filtrer et la placer. */
export interface LibraryRecipe {
  id: string;
  name: string;
  mealTags: MealSlot[];
}

/** Totaux nutritionnels d'une recette, tels que calculés par le back. */
export interface RecipeTotals {
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
}

/** Ligne de composition d'une recette : nom de l'aliment, quantité facultative et unité. */
export interface RecipeFoodLine {
  name: string;
  quantity: number | null;
  unit: string;
}

/** Fiche d'une recette placée : totaux du back et composition. */
export interface MealRecipeDetail {
  totals: RecipeTotals;
  foods: RecipeFoodLine[];
}
