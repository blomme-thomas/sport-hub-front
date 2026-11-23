import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { shoppingListFixtures } from '../../../../../mocks/fixtures/shopping-list.fixtures';
import type { ShoppingListItem } from '../../models/shopping-list.model';
import { ShoppingListComponent } from './shopping-list.component';

const ITEMS: ShoppingListItem[] = shoppingListFixtures.map((item) => ({ ...item }));
const RANGE = { from: '2026-03-16', to: '2026-03-18' };

async function setup(
  inputs: Partial<{
    items: ShoppingListItem[];
    loading: boolean;
    errorMessage: string | null;
  }> = {},
) {
  const copyRequested = vi.fn();
  await render(ShoppingListComponent, {
    inputs: { items: ITEMS, range: RANGE, loading: false, errorMessage: null, ...inputs },
    on: { copyRequested },
  });
  return { copyRequested };
}

describe('ShoppingListComponent', () => {
  it('affiche la période et les lignes groupées par catégorie', async () => {
    await setup();

    expect(screen.getByText('Du lundi 16 mars au mercredi 18 mars')).toBeInTheDocument();
    const protein = screen.getByRole('region', { name: 'Protéines' });
    expect(within(protein).getByText('Poulet (blanc)')).toBeInTheDocument();
    expect(within(protein).getByText('300 g')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Autres' })).toBeInTheDocument();
  });

  it('signale les quantités à compléter', async () => {
    await setup();

    expect(screen.getByText('240 g (quantité à compléter)')).toHaveClass(
      'shopping__quantity--missing',
    );
    expect(screen.getByText('quantité à compléter', { exact: true })).toBeInTheDocument();
  });

  it('émet le texte brut au clic sur Copier', async () => {
    const user = userEvent.setup();
    const { copyRequested } = await setup();

    await user.click(screen.getByRole('button', { name: 'Copier' }));

    expect(copyRequested).toHaveBeenCalledWith(expect.stringContaining('- Poulet (blanc) : 300 g'));
    expect(copyRequested.mock.calls[0]?.[0]).toContain('Liste de courses');
  });

  it('affiche un chargement sans liste', async () => {
    await setup({ loading: true });

    expect(screen.getByText('Calcul de la liste…')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Protéines' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier' })).toBeDisabled();
  });

  it('affiche l’erreur de l’API', async () => {
    await setup({ items: [], errorMessage: 'Le calcul a échoué.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Le calcul a échoué.');
  });

  it('indique une période sans repas planifié', async () => {
    await setup({ items: [] });

    expect(screen.getByText('Aucun repas planifié sur cette période.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier' })).toBeDisabled();
  });
});
