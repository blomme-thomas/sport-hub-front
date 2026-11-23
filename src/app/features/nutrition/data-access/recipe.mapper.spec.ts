import { describe, expect, it } from 'vitest';
import { recipeDetailFixtures, recipesFixtures } from '../../../../mocks/fixtures/recipes.fixtures';
import { toRecipe, toRecipeDetail } from './recipe.mapper';

describe('recipe.mapper', () => {
  it('convertit une recette de la liste sans y ajouter de synthèse', () => {
    const recipe = toRecipe(recipesFixtures[0]!);

    expect(recipe).toEqual(recipesFixtures[0]);
    expect(recipe).not.toHaveProperty('totals');
  });

  it('recopie la synthèse du back telle quelle, sans recalcul', () => {
    const detail = toRecipeDetail(recipeDetailFixtures[2]!);

    expect(detail.totals).toEqual(recipeDetailFixtures[2]!.nutrition.totals);
    expect(detail.byComponent).toEqual(recipeDetailFixtures[2]!.nutrition.byComponent);
    expect(detail.ignored).toEqual([
      { foodId: '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e15', reason: 'quantity-missing' },
    ]);
  });
});
