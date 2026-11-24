import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { NzMessageService } from 'ng-zorro-antd/message';
import { describe, expect, it, vi } from 'vitest';
import { apiTestProviders } from '../../../../../mocks/api.testing';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../../mocks/server';
import { FoodsPanelComponent } from './foods-panel.component';

async function setup() {
  await render(FoodsPanelComponent, { providers: apiTestProviders() });
  // Le tableau n'apparaît qu'une fois la base chargée.
  await screen.findByRole('table');
}

describe('FoodsPanelComponent', () => {
  it('affiche la base avec les compteurs par catégorie', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Tous (6)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Protéines (3)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Légumes (1)' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(7);
  });

  it('combine la recherche et le filtre par catégorie', async () => {
    const user = userEvent.setup();
    await setup();

    await user.click(screen.getByRole('button', { name: 'Féculents (2)' }));
    await user.type(screen.getByRole('searchbox'), 'lent');

    expect(screen.getByRole('button', { name: 'Féculents (2)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Lentilles');
  });

  it('affiche un message quand la recherche ne trouve rien', async () => {
    const user = userEvent.setup();
    await setup();

    await user.type(screen.getByRole('searchbox'), 'zzz');

    expect(screen.getByText('Aucun aliment ne correspond à votre recherche.')).toBeInTheDocument();
  });

  it('affiche l’erreur de l’API avec un bouton Réessayer', async () => {
    server.use(http.get('*/api/foods', () => new HttpResponse(null, { status: 500 })));
    await render(FoodsPanelComponent, { providers: apiTestProviders() });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });

  it('modifie un aliment depuis la modale puis confirme', async () => {
    const user = userEvent.setup();
    await setup();
    const messages = TestBed.inject(NzMessageService) as unknown as {
      success: ReturnType<typeof vi.fn>;
    };

    await user.click(screen.getByRole('button', { name: 'Modifier Saumon' }));
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText('Nom');
    expect(name).toHaveValue('Saumon');
    await user.clear(name);
    await user.type(name, 'Saumon fumé');
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await vi.waitFor(() => expect(messages.success).toHaveBeenCalledWith('Aliment modifié.'));
    expect(await screen.findByRole('rowheader', { name: /Saumon fumé/ })).toBeInTheDocument();
  });

  it('ajoute un aliment depuis la modale', async () => {
    const user = userEvent.setup();
    await setup();
    const messages = TestBed.inject(NzMessageService) as unknown as {
      success: ReturnType<typeof vi.fn>;
    };

    await user.click(screen.getByRole('button', { name: 'Ajouter un aliment' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Nom'), 'Quinoa cuit');
    await user.type(within(dialog).getByLabelText('Unité'), 'g');
    await user.click(within(dialog).getByRole('checkbox', { name: 'Féculents' }));
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await vi.waitFor(() => expect(messages.success).toHaveBeenCalledWith('Aliment ajouté.'));
    expect(await screen.findByRole('rowheader', { name: /Quinoa cuit/ })).toBeInTheDocument();
  });
});
