/** Macronutriments répartis en énergie : protéines et glucides valent 4 kcal/g, lipides 9 kcal/g. */
export const KCAL_PER_GRAM = { proteins: 4, carbohydrates: 4, fats: 9 } as const;

export type MacroKey = keyof typeof KCAL_PER_GRAM;

export interface MacroShare {
  key: MacroKey;
  /** Part de l'énergie, en pourcentage entier. */
  percent: number;
  /** Quantité en grammes telle que renvoyée par le back ; `null` si absente. */
  grams: number | null;
}

export interface MacroGrams {
  proteins: number | null;
  carbohydrates: number | null;
  fats: number | null;
}

/**
 * Part de chaque macronutriment dans l'énergie apportée par ces trois macros. Une valeur absente ne compte pas.
 * Renvoie `null` quand il n'y a aucune énergie à répartir. Les pourcentages sont arrondis : leur somme peut
 * différer de 100 de 1 point.
 */
export function macroEnergyShares(grams: MacroGrams): MacroShare[] | null {
  const keys = Object.keys(KCAL_PER_GRAM) as MacroKey[];
  const kcal = keys.map((key) => (grams[key] === null ? 0 : grams[key] * KCAL_PER_GRAM[key]));
  const total = kcal.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return null;
  }
  return keys.map((key, index) => ({
    key,
    percent: Math.round((kcal[index] / total) * 100),
    grams: grams[key],
  }));
}
