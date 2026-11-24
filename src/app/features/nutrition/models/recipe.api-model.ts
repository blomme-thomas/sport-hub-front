import type { MealTag } from './meal-tag';
import type { NutritionGroup, NutritionTotals, RecipeComponent } from './recipe.model';

/** Forme JSON d'un item de recette (contrat : `sport-hub-back`). */
export interface RecipeItemApi {
  foodId: string;
  component: RecipeComponent | null;
  quantity: number | null;
}

/** Forme JSON d'une recette dans `GET /api/recipes` (sans synthèse nutritionnelle). */
export interface RecipeApi {
  id: string;
  name: string;
  mealTags: MealTag[];
  items: RecipeItemApi[];
}

/** Forme JSON de `GET /api/recipes/:id` : la recette et sa synthèse `nutrition`. */
export interface RecipeDetailApi extends RecipeApi {
  nutrition: {
    totals: NutritionTotals;
    byComponent: Partial<Record<NutritionGroup, NutritionTotals>>;
    ignored: { foodId: string; reason: 'quantity-missing' | 'nutrition-missing' }[];
  };
}

/** Corps de `POST /api/recipes` et `PATCH /api/recipes/:id` ; `items` remplace toute la composition. */
export interface RecipeRequestApi {
  name: string;
  mealTags: MealTag[];
  items: RecipeItemApi[];
}

/** Corps de `POST /api/recipes/preview` : composition à évaluer, rien n'est enregistré. */
export interface RecipePreviewRequestApi {
  items: RecipeItemApi[];
}

/** Réponse de `POST /api/recipes/preview`. */
export interface RecipePreviewApi {
  totals: NutritionTotals;
  ignored: { foodId: string; reason: 'quantity-missing' | 'nutrition-missing' }[];
}
