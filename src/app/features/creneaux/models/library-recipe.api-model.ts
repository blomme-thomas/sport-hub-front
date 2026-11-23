import type { RecipeTotals } from './library-recipe.model';

/** Forme JSON d'une recette dans `GET /api/recipes` (seuls l'identifiant et le nom sont lus ici). */
export interface LibraryRecipeApi {
  id: string;
  name: string;
}

/** Forme JSON de `GET /api/recipes/:id` : seule la synthèse est lue ici. */
export interface LibraryRecipeDetailApi {
  nutrition: { totals: RecipeTotals };
}
