import type { RecipeApi, RecipeDetailApi, RecipeRequestApi } from '../models/recipe.api-model';
import type { Recipe, RecipeDetail, RecipeInput } from '../models/recipe.model';

export function toRecipe(api: RecipeApi): Recipe {
  return {
    id: api.id,
    name: api.name,
    mealTags: [...api.mealTags],
    items: api.items.map((item) => ({
      foodId: item.foodId,
      component: item.component,
      quantity: item.quantity,
    })),
  };
}

/** Recette et synthèse telles que renvoyées par le back : aucun total n'est recalculé ici. */
export function toRecipeDetail(api: RecipeDetailApi): RecipeDetail {
  return {
    ...toRecipe(api),
    totals: { ...api.nutrition.totals },
    byComponent: { ...api.nutrition.byComponent },
    ignored: api.nutrition.ignored.map((line) => ({ ...line })),
  };
}

export function toRecipeRequest(input: RecipeInput): RecipeRequestApi {
  return {
    name: input.name,
    mealTags: [...input.mealTags],
    items: input.items.map((item) => ({
      foodId: item.foodId,
      component: item.component,
      quantity: item.quantity,
    })),
  };
}
