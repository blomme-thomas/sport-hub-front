import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  recipeDetailFixtures,
  recipesFixtures,
} from '../../../../../mocks/fixtures/recipes.fixtures';
import { toRecipe, toRecipeDetail } from '../../data-access/recipe.mapper';
import { RecipeCardComponent } from './recipe-card.component';

const recipe = toRecipe(recipesFixtures[0]!);
const detail = toRecipeDetail(recipeDetailFixtures[0]!);
const OPEN_NAME = 'Ouvrir la recette Poulet riz légumes';

describe('RecipeCardComponent', () => {
  it('affiche le repas et les totaux fournis par le back', async () => {
    await render(RecipeCardComponent, { inputs: { recipe, detail } });

    expect(screen.getByRole('button', { name: OPEN_NAME })).toHaveTextContent('Midi');
    expect(screen.getByText('437,5 kcal')).toBeInTheDocument();
    expect(screen.getByText('52,5 g P')).toBeInTheDocument();
    expect(screen.getByText('40,2 g G')).toBeInTheDocument();
    expect(screen.getByText('6,2 g L')).toBeInTheDocument();
  });

  it('affiche un message tant que la synthèse n’est pas chargée', async () => {
    await render(RecipeCardComponent, { inputs: { recipe, detail: undefined } });

    expect(screen.getByText('Synthèse en cours…')).toBeInTheDocument();
  });

  it('émet la recette au clic', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    await render(RecipeCardComponent, { inputs: { recipe, detail }, on: { open } });

    await user.click(screen.getByRole('button', { name: OPEN_NAME }));

    expect(open).toHaveBeenCalledWith(recipe);
  });
});
