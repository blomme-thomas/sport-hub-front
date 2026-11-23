/** Catégories de la liste de courses, dans l'ordre d'affichage. */
export const SHOPPING_CATEGORIES = ['proteine', 'legume', 'feculent', 'autre'] as const;

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

/** Une ligne de la liste de courses, calculée par le back pour une période. Non sauvegardée. */
export interface ShoppingListItem {
  foodId: string;
  name: string;
  unit: string;
  category: ShoppingCategory;
  /** Somme des quantités connues sur la période ; `null` si aucune n'est connue. */
  quantity: number | null;
  /** Vrai si au moins une occurrence n'a pas de quantité : à compléter à la main. */
  quantityMissing: boolean;
}

/** Période choisie sur le calendrier, bornes incluses (`YYYY-MM-DD`). */
export interface DateRange {
  from: string;
  to: string;
}
