import type { ShoppingCategory } from './shopping-list.model';

/** Forme JSON d'une ligne de `GET /api/shopping-list?from=&to=` (contrat : `sport-hub-back`). */
export interface ShoppingListItemApi {
  foodId: string;
  name: string;
  unit: string;
  category: ShoppingCategory;
  quantity: number | null;
  quantityMissing: boolean;
}
