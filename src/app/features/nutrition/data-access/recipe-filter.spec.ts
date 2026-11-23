import { describe, expect, it } from 'vitest';
import { recipesFixtures } from '../../../../mocks/fixtures/recipes.fixtures';
import { countRecipesByMealTag, filterRecipes } from './recipe-filter';
import { toRecipe } from './recipe.mapper';

const recipes = recipesFixtures.map(toRecipe);
const names = (list: readonly { name: string }[]) => list.map((recipe) => recipe.name);

describe('filterRecipes', () => {
  it('renvoie tout sans recherche ni repas', () => {
    expect(filterRecipes(recipes, { search: '', mealTag: null })).toHaveLength(3);
  });

  it('recherche le nom sans tenir compte de la casse', () => {
    expect(names(filterRecipes(recipes, { search: '  SAUMON', mealTag: null }))).toEqual([
      'Saumon riz',
    ]);
  });

  it('filtre par repas : une recette compte dans chacun de ses repas', () => {
    expect(names(filterRecipes(recipes, { search: '', mealTag: 'soir' }))).toEqual([
      'Poulet riz légumes',
      'Saumon riz',
    ]);
  });

  it('combine recherche et repas (ET logique)', () => {
    expect(filterRecipes(recipes, { search: 'lentilles', mealTag: 'soir' })).toEqual([]);
    expect(names(filterRecipes(recipes, { search: 'riz', mealTag: 'midi' }))).toEqual([
      'Poulet riz légumes',
    ]);
  });
});

describe('countRecipesByMealTag', () => {
  it('compte les recettes par repas', () => {
    expect(countRecipesByMealTag(recipes)).toEqual({ matin: 0, midi: 2, soir: 2 });
  });
});
