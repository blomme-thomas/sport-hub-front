import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LibraryRecipe } from '../../models/library-recipe.model';
import { RecipeLibraryComponent } from './recipe-library.component';

const RECIPES: LibraryRecipe[] = [
  { id: 'recipe-chicken', name: 'Poulet riz légumes', mealTags: ['midi', 'soir'] },
  { id: 'recipe-porridge', name: 'Porridge banane', mealTags: ['matin'] },
];

/** Carte draggable qui contient le nom donné. */
function cardOf(name: string): HTMLElement {
  return screen.getByText(name).closest('li') as HTMLElement;
}

describe('RecipeLibraryComponent', () => {
  it('affiche les recettes en cartes, glissables sur ordinateur', async () => {
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: true } });

    expect(screen.getByRole('heading', { name: 'Mes recettes' })).toBeInTheDocument();
    expect(screen.queryByText(/Le placement se fait sur ordinateur/)).not.toBeInTheDocument();
    expect(cardOf('Poulet riz légumes')).toHaveAttribute('draggable', 'true');
    expect(screen.getByText('Midi · Soir')).toBeInTheDocument();
  });

  it('désactive le glisser et explique le placement sur mobile', async () => {
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: false } });

    expect(screen.getByText(/Le placement se fait sur ordinateur/)).toBeInTheDocument();
    expect(cardOf('Poulet riz légumes')).toHaveAttribute('draggable', 'false');
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

  it('ouvre la fiche de la recette au clic sur son nom', async () => {
    const user = userEvent.setup();
    const recipeSelected = vi.fn();
    await render(RecipeLibraryComponent, {
      inputs: { recipes: RECIPES, canDrag: true },
      on: { recipeSelected },
    });

    await user.click(screen.getByRole('button', { name: 'Ouvrir Porridge banane' }));

    expect(recipeSelected).toHaveBeenCalledWith(RECIPES[1]);
  });

  it('filtre par nom, sans tenir compte de la casse', async () => {
    const user = userEvent.setup();
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: true } });

    await user.type(screen.getByRole('searchbox'), 'PORRIDGE');

    expect(screen.getByText('Porridge banane')).toBeInTheDocument();
    expect(screen.queryByText('Poulet riz légumes')).not.toBeInTheDocument();
  });

  it('filtre par repas et compte les recettes de chaque repas', async () => {
    const user = userEvent.setup();
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: true } });

    expect(screen.getByRole('button', { name: 'Soir (1)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Soir (1)' }));

    expect(screen.getByRole('button', { name: 'Soir (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Poulet riz légumes')).toBeInTheDocument();
    expect(screen.queryByText('Porridge banane')).not.toBeInTheDocument();
  });

  it('indique qu’aucune recette ne correspond au filtre', async () => {
    const user = userEvent.setup();
    await render(RecipeLibraryComponent, { inputs: { recipes: RECIPES, canDrag: true } });

    await user.type(screen.getByRole('searchbox'), 'introuvable');

    expect(screen.getByText('Aucune recette ne correspond à votre recherche.')).toBeInTheDocument();
  });

  it('indique qu’il n’y a pas encore de recette', async () => {
    await render(RecipeLibraryComponent, { inputs: { recipes: [], canDrag: true } });

    expect(screen.getByText(/Aucune recette/)).toBeInTheDocument();
  });
});
