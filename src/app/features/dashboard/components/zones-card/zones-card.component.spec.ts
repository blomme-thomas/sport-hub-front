import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ZonesCardView } from '../../models/zones-card.model';
import { ZonesCardComponent } from './zones-card.component';

const VIEW: ZonesCardView = {
  optimalPercent: 70,
  statusMessage: 'Bon équilibre en zone optimale',
  zones: [
    { label: 'Z5', name: 'Puissance', percent: 5, seconds: 0, colorVariable: '--sh-violet' },
    { label: 'Z4', name: 'Seuil', percent: 15, seconds: 0, colorVariable: '--sh-danger' },
    { label: 'Z3', name: 'Tempo', percent: 40, seconds: 0, colorVariable: '--sh-orange' },
    { label: 'Z2', name: 'Endurance', percent: 30, seconds: 0, colorVariable: '--sh-success' },
    {
      label: 'Z1',
      name: 'Récupération',
      percent: 10,
      seconds: 0,
      colorVariable: '--sh-text-muted',
    },
  ],
};

describe('ZonesCardComponent', () => {
  it('affiche la légende des cinq zones avec leur pourcentage', async () => {
    await render(ZonesCardComponent, { inputs: { view: VIEW } });

    expect(screen.getByRole('list', { name: 'Légende des zones cardiaques' })).toBeInTheDocument();
    expect(screen.getByText('Z3')).toBeInTheDocument();
    expect(screen.getByText('Tempo')).toBeInTheDocument();
    expect(screen.getByText('40 %')).toBeInTheDocument();
  });

  it('affiche le pourcentage en zone optimale et le message de statut', async () => {
    await render(ZonesCardComponent, { inputs: { view: VIEW } });

    expect(screen.getByText('70 %')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Bon équilibre en zone optimale');
  });

  it('affiche un état vide explicite sans donnée, sans valeur fictive', async () => {
    await render(ZonesCardComponent, {
      inputs: { view: { zones: [], optimalPercent: null, statusMessage: null } },
    });

    expect(
      screen.getByText('Aucune donnée de zone cardiaque sur cette période'),
    ).toBeInTheDocument();
    // Le gabarit reste celui des données : les cinq zones de repère, avec leur nom et un tiret.
    const legend = screen.getByRole('list', { name: 'Légende des zones cardiaques' });
    expect(within(legend).getAllByText('— %')).toHaveLength(5);
    expect(within(legend).getByText('Puissance')).toBeInTheDocument();
  });

  it('affiche un état de chargement tant que la vue n’est pas reçue', async () => {
    const { container } = await render(ZonesCardComponent, {
      inputs: { view: undefined, loading: true },
    });

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(container.querySelector('section')).toHaveAttribute('aria-busy', 'true');
  });

  it('affiche son erreur avec un bouton Réessayer qui émet retry', async () => {
    const retry = vi.fn();
    await render(ZonesCardComponent, {
      inputs: { view: undefined, errorMessage: 'Zones indisponibles' },
      on: { retry },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Zones indisponibles');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
