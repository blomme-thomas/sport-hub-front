import type { MealSlot } from './meal-slot';
import type { RecipeTotals } from './library-recipe.model';

/** Forme JSON d'une recette dans `GET /api/recipes` (identifiant, nom et repas ; le reste est ignoré ici). */
export interface LibraryRecipeApi {
  id: string;
  name: string;
  mealTags: MealSlot[];
}

/** Forme JSON de `GET /api/recipes/:id` : la composition et la synthèse sont lues ici. */
export interface LibraryRecipeDetailApi {
  items: { foodId: string; quantity: number | null }[];
  nutrition: { totals: RecipeTotals };
}

/** Forme JSON d'un aliment dans `GET /api/foods` (seuls le nom et l'unité sont lus ici). */
export interface LibraryFoodApi {
  id: string;
  name: string;
  unit: string;
}
