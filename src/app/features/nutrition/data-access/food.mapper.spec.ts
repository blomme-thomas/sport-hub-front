import { describe, expect, it } from 'vitest';
import { foodsFixtures } from '../../../../mocks/fixtures/foods.fixtures';
import { toFood, toFoodRequest } from './food.mapper';

describe('food.mapper', () => {
  it('convertit un aliment de l’API en modèle UI, valeurs vides comprises', () => {
    const [chicken] = foodsFixtures;
    expect(toFood(chicken!)).toEqual(chicken);

    const spices = foodsFixtures.at(-1)!;
    expect(toFood(spices).calories).toBeNull();
  });

  it('ne partage pas le tableau des catégories avec le modèle source', () => {
    const [chicken] = foodsFixtures;
    const food = toFood(chicken!);

    food.categories.push('autre');

    expect(chicken!.categories).toEqual(['proteine']);
  });

  it('envoie les valeurs vides comme null, sans les omettre', () => {
    const body = toFoodRequest({
      name: 'Curry',
      unit: 'g',
      categories: ['autre'],
      calories: null,
      proteins: null,
      carbohydrates: 1,
      fats: null,
      sugars: null,
    });

    expect(body).toEqual({
      name: 'Curry',
      unit: 'g',
      categories: ['autre'],
      calories: null,
      proteins: null,
      carbohydrates: 1,
      fats: null,
      sugars: null,
    });
  });
});
