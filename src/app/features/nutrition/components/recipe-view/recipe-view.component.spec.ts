import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { foodsFixtures } from '../../../../../mocks/fixtures/foods.fixtures';
import { recipeDetailFixtures } from '../../../../../mocks/fixtures/recipes.fixtures';
import { toFood } from '../../data-access/food.mapper';
import { toRecipeDetail } from '../../data-access/recipe.mapper';
import { RecipeViewComponent } from './recipe-view.component';

const foods = new Map(foodsFixtures.map((food) => [food.id, toFood(food)]));

async function setup(index: number) {
  await render(RecipeViewComponent, {
    inputs: { recipe: toRecipeDetail(recipeDetailFixtures[index]!), foods },
  });
}

describe('RecipeViewComponent', () => {
  it('affiche les totaux du back et la composition par composant', async () => {
    await setup(0);

    expect(screen.getByText('437,5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Protéine' })).toBeInTheDocument();
    expect(screen.getByText('Poulet (blanc)')).toBeInTheDocument();
    expect(screen.getByText('150 g')).toBeInTheDocument();
  });

  it('signale les éléments exclus du total et les aliments sans quantité', async () => {
    await setup(2);

    expect(
      screen.getByText('1 élément(s) exclu(s) du total : quantité ou valeur manquante.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Épices (curry)')).toBeInTheDocument();
    expect(screen.getByText('Quantité non renseignée')).toBeInTheDocument();
  });
});
