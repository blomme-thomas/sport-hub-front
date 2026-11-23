import type { ShoppingListItemApi } from '../../app/features/creneaux/models/shopping-list.api-model';

/** Liste de courses de test, triée par catégorie puis par nom comme le back. */
export const shoppingListFixtures: ShoppingListItemApi[] = [
  {
    foodId: '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e13',
    name: 'Brocoli',
    unit: 'g',
    category: 'legume',
    quantity: 200,
    quantityMissing: false,
  },
  {
    foodId: '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e10',
    name: 'Poulet (blanc)',
    unit: 'g',
    category: 'proteine',
    quantity: 300,
    quantityMissing: false,
  },
  {
    foodId: '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e12',
    name: 'Riz cuit',
    unit: 'g',
    category: 'feculent',
    quantity: 240,
    quantityMissing: true,
  },
  {
    foodId: '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e15',
    name: 'Épices (curry)',
    unit: 'g',
    category: 'autre',
    quantity: null,
    quantityMissing: true,
  },
];
