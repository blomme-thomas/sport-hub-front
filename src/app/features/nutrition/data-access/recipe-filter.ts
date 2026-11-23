import type { MealTag } from '../models/meal-tag';
import type { Recipe } from '../models/recipe.model';

export interface RecipeFilter {
  /** Sous-chaîne recherchée dans le nom, sans tenir compte de la casse ; vide = pas de recherche. */
  search: string;
  /** Repas exigé parmi les tags de la recette, `null` pour tous. */
  mealTag: MealTag | null;
}

/** Recettes correspondant à la recherche ET au repas, dans l'ordre reçu. */
export function filterRecipes(
  recipes: readonly Recipe[],
  { search, mealTag }: RecipeFilter,
): Recipe[] {
  const term = search.trim().toLocaleLowerCase('fr-FR');
  return recipes.filter(
    (recipe) =>
      (term === '' || recipe.name.toLocaleLowerCase('fr-FR').includes(term)) &&
      (mealTag === null || recipe.mealTags.includes(mealTag)),
  );
}

/** Nombre de recettes associées à chaque repas (une recette compte dans chacun de ses repas). */
export function countRecipesByMealTag(recipes: readonly Recipe[]): Record<MealTag, number> {
  const counts: Record<MealTag, number> = { matin: 0, midi: 0, soir: 0 };
  for (const recipe of recipes) {
    for (const mealTag of recipe.mealTags) {
      counts[mealTag] += 1;
    }
  }
  return counts;
}
