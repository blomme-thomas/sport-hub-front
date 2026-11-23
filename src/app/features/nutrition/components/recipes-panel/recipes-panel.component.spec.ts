import { TestBed } from '@angular/core/testing';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { NzMessageService } from 'ng-zorro-antd/message';
import { describe, expect, it, vi } from 'vitest';
import { apiTestProviders } from '../../../../../mocks/api.testing';
import { server } from '../../../../../mocks/server';
import { RecipesPanelComponent } from './recipes-panel.component';

async function setup() {
  await render(RecipesPanelComponent, { providers: apiTestProviders() });
  await screen.findByRole('list', { name: 'Recettes' });
}

function messagesMock() {
  return TestBed.inject(NzMessageService) as unknown as { success: ReturnType<typeof vi.fn> };
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

  it('ouvre la consultation dans une modale, avec un bouton Modifier', async () => {
    const user = userEvent.setup();
    await setup();
    await screen.findByText('437,5 kcal');

    await user.click(screen.getByRole('button', { name: 'Ouvrir la recette Poulet riz légumes' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Composition' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Modifier la recette' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
  });

  it('affiche l’erreur de l’API avec un bouton Réessayer', async () => {
    server.use(http.get('*/api/recipes', () => new HttpResponse(null, { status: 500 })));
    await render(RecipesPanelComponent, { providers: apiTestProviders() });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });

  it('modifie une recette depuis sa consultation puis confirme', async () => {
    const user = userEvent.setup();
    await setup();
    await screen.findByText('437,5 kcal');

    await user.click(screen.getByRole('button', { name: 'Ouvrir la recette Saumon riz' }));
    const view = await screen.findByRole('dialog');
    await user.click(within(view).getByRole('button', { name: 'Modifier la recette' }));

    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText('Nom de la recette');
    expect(name).toHaveValue('Saumon riz');
    await user.clear(name);
    await user.type(name, 'Saumon riz doux');
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await vi.waitFor(() =>
      expect(messagesMock().success).toHaveBeenCalledWith('Recette modifiée.'),
    );
    expect(
      await screen.findByRole('button', { name: 'Ouvrir la recette Saumon riz doux' }),
    ).toBeInTheDocument();
  });

  it('crée une recette depuis le bouton Nouvelle recette', async () => {
    const user = userEvent.setup();
    await setup();

    await user.click(screen.getByRole('button', { name: 'Nouvelle recette' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Nom de la recette'), 'Omelette épinards');
    await user.click(within(dialog).getByRole('checkbox', { name: 'Matin' }));
    const free = within(dialog).getByRole('group', { name: 'Autre (optionnel)' });
    await user.click(within(free).getByRole('button', { name: 'Ajouter un aliment' }));
    await user.selectOptions(
      within(free).getByRole('combobox'),
      '3f2c9a4e-8b1d-4c7a-9e2f-6a5b4c3d2e13',
    );

    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await vi.waitFor(() => expect(messagesMock().success).toHaveBeenCalledWith('Recette ajoutée.'));
    expect(
      await screen.findByRole('button', { name: 'Ouvrir la recette Omelette épinards' }),
    ).toBeInTheDocument();
  });
});
