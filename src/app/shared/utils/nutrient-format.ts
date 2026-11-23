const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/**
 * Valeur nutritionnelle affichée en français, suivie de son unité si elle est donnée (ex. « 31 g »).
 * Une valeur vide (`null`) s'affiche avec le texte `empty` (ex. « — »).
 */
export function formatNutrient(value: number | null, empty: string, unit = ''): string {
  if (value === null) {
    return empty;
  }
  const formatted = NUMBER_FORMAT.format(value);
  return unit === '' ? formatted : `${formatted} ${unit}`;
}
