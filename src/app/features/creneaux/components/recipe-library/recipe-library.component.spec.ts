import { render, screen, fireEvent } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import type { LibraryRecipe } from '../../models/library-recipe.model';
import { RecipeLibraryComponent } from './recipe-library.component';

const RECIPES: LibraryRecipe[] = [
  { id: 'recipe-chicken', name: 'Poulet riz légumes' },
  { id: 'recipe-porridge', name: 'Porridge banane' },
];

describe('RecipeLibraryComponent', () => {
  it('liste les recettes à placer, glissables sur ordinateur', async () => {
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: true } });

    expect(screen.getByRole('heading', { name: 'Mes recettes' })).toBeInTheDocument();
    expect(
      screen.getByText('Glissez une recette dans une case du calendrier.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Poulet riz légumes')).toHaveAttribute('draggable', 'true');
  });

  it('désactive le glisser et explique le placement sur mobile', async () => {
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: false } });

    expect(screen.getByText(/Le placement se fait sur ordinateur/)).toBeInTheDocument();
    expect(screen.getByText('Poulet riz légumes')).toHaveAttribute('draggable', 'false');
  });

  it('transporte l’identifiant de la recette au début du glissement', async () => {
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: true } });
    const setData = vi.fn();

    fireEvent.dragStart(screen.getByText('Porridge banane'), {
      dataTransfer: { setData, effectAllowed: '' },
    });

    expect(setData).toHaveBeenCalledWith('text/plain', 'recipe-porridge');
  });

  it('annule le glissement quand il est désactivé', async () => {
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: false } });
    const setData = vi.fn();

    const notPrevented = fireEvent.dragStart(screen.getByText('Porridge banane'), {
      dataTransfer: { setData, effectAllowed: '' },
    });

    expect(notPrevented).toBe(false);
    expect(setData).not.toHaveBeenCalled();
  });

  it('indique qu’il n’y a pas encore de recette', async () => {
    await render(RecipeLibraryComponent, { inputs: { recipes: [], canDrag: true } });

    expect(screen.getByText(/Aucune recette/)).toBeInTheDocument();
  });
});
