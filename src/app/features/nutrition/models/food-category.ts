/** Catégories d'un aliment, dans l'ordre d'affichage du back (`FOOD_CATEGORIES`). */
export const FOOD_CATEGORIES = ['proteine', 'legume', 'feculent', 'autre'] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];
