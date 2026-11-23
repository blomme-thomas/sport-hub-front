import type { FoodCategory } from './food-category';

/** Forme JSON d'un aliment renvoyé par `GET /api/foods` (contrat : `sport-hub-back`). */
export interface FoodApi {
  id: string;
  name: string;
  unit: string;
  categories: FoodCategory[];
  calories: number | null;
  proteins: number | null;
  carbohydrates: number | null;
  fats: number | null;
  sugars: number | null;
}

/**
 * Corps de `POST /api/foods` et `PATCH /api/foods/:id`. En modification, chaque valeur est envoyée :
 * `null` efface une valeur nutritionnelle.
 */
export interface FoodRequestApi {
  name: string;
  unit: string;
  categories: FoodCategory[];
  calories: number | null;
  proteins: number | null;
  carbohydrates: number | null;
  fats: number | null;
  sugars: number | null;
}
