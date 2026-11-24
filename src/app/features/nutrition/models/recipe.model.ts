import type { MealTag } from './meal-tag';

/** Composant d'une recette ; `null` côté item = sélection libre (ex. petit-déjeuner). */
export type RecipeComponent = 'proteine' | 'legume' | 'feculent';

/** Groupe de totaux : un composant, ou « libre » pour les items sans composant. */
export type NutritionGroup = RecipeComponent | 'libre';

export interface RecipeItem {
  foodId: string;
  component: RecipeComponent | null;
  quantity: number | null;
}

/** Totaux calculés par le back, valeurs pour les quantités indiquées. */
export interface NutritionTotals {
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  sugars: number;
}

export interface Recipe {
  id: string;
  name: string;
  mealTags: MealTag[];
  items: RecipeItem[];
}

/** Recette avec sa synthèse nutritionnelle, telle que renvoyée par `GET /api/recipes/:id`. */
export interface RecipeDetail extends Recipe {
  totals: NutritionTotals;
  byComponent: Partial<Record<NutritionGroup, NutritionTotals>>;
  ignored: { foodId: string; reason: 'quantity-missing' | 'nutrition-missing' }[];
}

/** Saisie de création ou de modification ; la composition remplace l'existante. */
export interface RecipeInput {
  name: string;
  mealTags: MealTag[];
  items: RecipeItem[];
}

/** Synthèse d'une composition non enregistrée (aperçu en direct), même forme que la synthèse d'une recette. */
export interface RecipePreview {
  totals: NutritionTotals;
  ignored: RecipeDetail['ignored'];
}
