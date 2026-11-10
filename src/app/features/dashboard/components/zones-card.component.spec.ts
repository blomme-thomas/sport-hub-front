import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import type { ZonesCardView } from '../models/zones-card.model';
import { ZonesCardComponent } from './zones-card.component';

const VIEW: ZonesCardView = {
  optimalPercent: 70,
  statusMessage: 'Bon équilibre en zone optimale',
  zones: [
    { label: 'Z5', name: 'Puissance', percent: 5, colorVariable: '--sh-violet' },
    { label: 'Z4', name: 'Seuil', percent: 15, colorVariable: '--sh-danger' },
    { label: 'Z3', name: 'Tempo', percent: 40, colorVariable: '--sh-orange' },
    { label: 'Z2', name: 'Endurance', percent: 30, colorVariable: '--sh-success' },
    { label: 'Z1', name: 'Récupération', percent: 10, colorVariable: '--sh-text-muted' },
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
    expect(
      screen.queryByRole('list', { name: 'Légende des zones cardiaques' }),
    ).not.toBeInTheDocument();
  });
});
