import { formatNutrient } from '@shared/utils/nutrient-format';
import {
  SHOPPING_CATEGORIES,
  type ShoppingCategory,
  type ShoppingListItem,
} from '../../models/shopping-list.model';

export interface ShoppingGroup {
  category: ShoppingCategory;
  items: ShoppingListItem[];
}

export interface ShoppingTextLabels {
  title: string;
  categories: Record<ShoppingCategory, string>;
  /** Mention d'une quantité à compléter à la main. */
  missing: string;
  /** Affichage d'une valeur vide. */
  empty: string;
}

/** Lignes regroupées par catégorie, dans l'ordre d'affichage ; une catégorie vide n'apparaît pas. */
export function groupByCategory(items: readonly ShoppingListItem[]): ShoppingGroup[] {
  return SHOPPING_CATEGORIES.flatMap((category) => {
    const inCategory = items.filter((item) => item.category === category);
    return inCategory.length === 0 ? [] : [{ category, items: inCategory }];
  });
}

/**
 * Quantité d'une ligne : la somme connue suivie de l'unité, et la mention « à compléter » si une occurrence
 * n'a pas de quantité. Sans aucune quantité connue, seule la mention est affichée.
 */
export function quantityText(item: ShoppingListItem, labels: ShoppingTextLabels): string {
  if (item.quantity === null) {
    return labels.missing;
  }
  const amount = formatNutrient(item.quantity, labels.empty, item.unit);
  return item.quantityMissing ? `${amount} (${labels.missing})` : amount;
}

/** Texte brut de la liste, prêt à coller : titre, période, puis une ligne par aliment, groupées par catégorie. */
export function formatShoppingListText(
  items: readonly ShoppingListItem[],
  period: string,
  labels: ShoppingTextLabels,
): string {
  const lines = [labels.title, period, ''];
  for (const group of groupByCategory(items)) {
    lines.push(labels.categories[group.category]);
    for (const item of group.items) {
      lines.push(`- ${item.name} : ${quantityText(item, labels)}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}
