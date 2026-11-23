import type { FoodCategory } from '../models/food-category';
import type { Food } from '../models/food.model';

export interface FoodFilter {
  /** Sous-chaîne recherchée dans le nom, sans tenir compte de la casse ; vide = pas de recherche. */
  search: string;
  /** Catégorie exigée, `null` pour toutes. */
  category: FoodCategory | null;
}

/** Aliments correspondant à la recherche ET à la catégorie, dans l'ordre reçu. */
export function filterFoods(foods: readonly Food[], { search, category }: FoodFilter): Food[] {
  const term = search.trim().toLocaleLowerCase('fr-FR');
  return foods.filter(
    (food) =>
      (term === '' || food.name.toLocaleLowerCase('fr-FR').includes(term)) &&
      (category === null || food.categories.includes(category)),
  );
}

/** Nombre d'aliments portant chaque catégorie (un aliment compte dans chacune de ses catégories). */
export function countFoodsByCategory(foods: readonly Food[]): Record<FoodCategory, number> {
  const counts: Record<FoodCategory, number> = { proteine: 0, legume: 0, feculent: 0, autre: 0 };
  for (const food of foods) {
    for (const category of food.categories) {
      counts[category] += 1;
    }
  }
  return counts;
}
