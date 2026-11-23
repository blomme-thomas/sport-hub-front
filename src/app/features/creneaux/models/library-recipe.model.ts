/** Recette de la bibliothèque du calendrier : ce qu'il faut pour la nommer et la placer. */
export interface LibraryRecipe {
  id: string;
  name: string;
}

/** Totaux nutritionnels d'une recette, tels que calculés par le back. */
export interface RecipeTotals {
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
}
