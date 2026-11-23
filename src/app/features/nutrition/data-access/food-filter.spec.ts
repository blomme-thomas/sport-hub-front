import { describe, expect, it } from 'vitest';
import { foodsFixtures } from '../../../../mocks/fixtures/foods.fixtures';
import { toFood } from './food.mapper';
import { countFoodsByCategory, filterFoods } from './food-filter';

const foods = foodsFixtures.map(toFood);
const names = (list: readonly { name: string }[]) => list.map((food) => food.name);

describe('filterFoods', () => {
  it('renvoie tout sans recherche ni catégorie', () => {
    expect(filterFoods(foods, { search: '', category: null })).toHaveLength(foods.length);
  });

  it('recherche une sous-chaîne sans tenir compte de la casse ni des espaces en bord', () => {
    expect(names(filterFoods(foods, { search: '  RIZ ', category: null }))).toEqual(['Riz cuit']);
    expect(names(filterFoods(foods, { search: 'poulet', category: null }))).toEqual([
      'Poulet (blanc)',
    ]);
  });

  it('filtre par catégorie, un aliment à plusieurs catégories apparaît dans chacune', () => {
    expect(names(filterFoods(foods, { search: '', category: 'feculent' }))).toEqual([
      'Riz cuit',
      'Lentilles cuites',
    ]);
    expect(names(filterFoods(foods, { search: '', category: 'proteine' }))).toContain(
      'Lentilles cuites',
    );
  });

  it('combine recherche et catégorie (ET logique)', () => {
    expect(names(filterFoods(foods, { search: 'lent', category: 'proteine' }))).toEqual([
      'Lentilles cuites',
    ]);
    expect(filterFoods(foods, { search: 'poulet', category: 'legume' })).toEqual([]);
  });
});

describe('countFoodsByCategory', () => {
  it('compte un aliment dans chacune de ses catégories', () => {
    expect(countFoodsByCategory(foods)).toEqual({
      proteine: 3,
      legume: 1,
      feculent: 2,
      autre: 1,
    });
  });

  it('renvoie zéro pour une base vide', () => {
    expect(countFoodsByCategory([])).toEqual({ proteine: 0, legume: 0, feculent: 0, autre: 0 });
  });
});
