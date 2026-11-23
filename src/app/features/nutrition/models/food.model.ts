import type { FoodCategory } from './food-category';

/** Aliment tel qu'affiché : valeurs pour 100 g, `null` quand la valeur est vide. */
export interface Food {
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

/** Saisie du formulaire, sans identifiant. */
export type FoodInput = Omit<Food, 'id'>;
