/**
 * Lit la valeur d'une variable CSS déclarée sur la racine du document (ex. `--sh-chart-series-1`).
 * Renvoie une chaîne vide si la variable est absente. Utile pour fournir des couleurs de thème à Chart.js,
 * qui ne résout pas `var(--x)` dans le canvas.
 */
export function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
