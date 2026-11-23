import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiTestProviders } from '../../../../../mocks/api.testing';
import { server } from '../../../../../mocks/server';
import { RecipesPanelComponent } from './recipes-panel.component';

async function setup() {
  await render(RecipesPanelComponent, { providers: apiTestProviders() });
  await screen.findByRole('list', { name: 'Recettes' });
}

describe('RecipesPanelComponent', () => {
  it('affiche une carte par recette, avec les compteurs par repas', async () => {
    await setup();

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Toutes (3)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Midi (2)' })).toBeInTheDocument();
    expect(await screen.findByText('437,5 kcal')).toBeInTheDocument();
  });

  it('combine la recherche et le filtre par repas', async () => {
    const user = userEvent.setup();
    await setup();

    await user.click(screen.getByRole('button', { name: 'Soir (2)' }));
    await user.type(screen.getByRole('searchbox'), 'saumon');

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(1);
    expect(within(cards[0]!).getByRole('button')).toHaveAccessibleName(
      'Ouvrir la recette Saumon riz',
    );
  });

  it('ouvre la consultation dans une modale en lecture seule', async () => {
    const user = userEvent.setup();
    await setup();
    await screen.findByText('437,5 kcal');

    await user.click(screen.getByRole('button', { name: 'Ouvrir la recette Poulet riz légumes' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Composition' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
  });

  it('affiche l’erreur de l’API avec un bouton Réessayer', async () => {
    server.use(http.get('*/api/recipes', () => new HttpResponse(null, { status: 500 })));
    await render(RecipesPanelComponent, { providers: apiTestProviders() });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });
});
