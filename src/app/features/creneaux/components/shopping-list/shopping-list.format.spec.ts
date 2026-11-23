import { describe, expect, it } from 'vitest';
import type { ShoppingListItem } from '../../models/shopping-list.model';
import {
  formatShoppingListText,
  groupByCategory,
  quantityText,
  type ShoppingTextLabels,
} from './shopping-list.format';

const LABELS: ShoppingTextLabels = {
  title: 'Liste de courses',
  categories: { proteine: 'Protéines', legume: 'Légumes', feculent: 'Féculents', autre: 'Autres' },
  missing: 'quantité à compléter',
  empty: '—',
};

const ITEMS: ShoppingListItem[] = [
  {
    foodId: 'a',
    name: 'Brocoli',
    unit: 'g',
    category: 'legume',
    quantity: 200,
    quantityMissing: false,
  },
  {
    foodId: 'b',
    name: 'Poulet (blanc)',
    unit: 'g',
    category: 'proteine',
    quantity: 300,
    quantityMissing: false,
  },
  {
    foodId: 'c',
    name: 'Riz cuit',
    unit: 'g',
    category: 'feculent',
    quantity: 240,
    quantityMissing: true,
  },
  {
    foodId: 'd',
    name: 'Épices (curry)',
    unit: 'g',
    category: 'autre',
    quantity: null,
    quantityMissing: true,
  },
];

describe('groupByCategory', () => {
  it('range les lignes par catégorie, dans l’ordre d’affichage, sans catégorie vide', () => {
    const groups = groupByCategory([ITEMS[0]!, ITEMS[1]!, ITEMS[3]!]);

    expect(groups.map((group) => group.category)).toEqual(['proteine', 'legume', 'autre']);
  });

  it('renvoie aucun groupe pour une liste vide', () => {
    expect(groupByCategory([])).toEqual([]);
  });
});

describe('quantityText', () => {
  it('affiche la somme suivie de l’unité', () => {
    expect(quantityText(ITEMS[1]!, LABELS)).toBe('300 g');
  });

  it('signale une quantité à compléter', () => {
    expect(quantityText(ITEMS[2]!, LABELS)).toBe('240 g (quantité à compléter)');
  });

  it('n’affiche que la mention quand aucune quantité n’est connue', () => {
    expect(quantityText(ITEMS[3]!, LABELS)).toBe('quantité à compléter');
  });
});

describe('formatShoppingListText', () => {
  it('produit un texte brut lisible, titre et période compris, groupé par catégorie', () => {
    const text = formatShoppingListText(ITEMS, 'Du lundi 23 au mercredi 25 novembre', LABELS);

    expect(text).toBe(
      [
        'Liste de courses',
        'Du lundi 23 au mercredi 25 novembre',
        '',
        'Protéines',
        '- Poulet (blanc) : 300 g',
        '',
        'Légumes',
        '- Brocoli : 200 g',
        '',
        'Féculents',
        '- Riz cuit : 240 g (quantité à compléter)',
        '',
        'Autres',
        '- Épices (curry) : quantité à compléter',
      ].join('\n'),
    );
  });
});
