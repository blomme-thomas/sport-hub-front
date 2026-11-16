import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SportSplitView } from '../../models/sport-split.model';
import { SportSplitCardComponent } from './sport-split-card.component';

const SPLIT: SportSplitView = {
  totalLabel: '6h 42',
  shares: [
    { family: 'running', label: 'Course à pied', percent: 52, colorVariable: '--sh-accent-text' },
    { family: 'cycling', label: 'Cyclisme', percent: 28, colorVariable: '--sh-success' },
    { family: 'swimming', label: 'Natation', percent: 12, colorVariable: '--sh-orange' },
    { family: 'other', label: 'Autres', percent: 8, colorVariable: '--sh-violet' },
  ],
};

describe('SportSplitCardComponent', () => {
  it('affiche la légende avec le pourcentage de chaque sport', async () => {
    await render(SportSplitCardComponent, { inputs: { split: SPLIT } });

    expect(screen.getByText('Course à pied')).toBeInTheDocument();
    expect(screen.getByText('52 %')).toBeInTheDocument();
    expect(screen.getByText('8 %')).toBeInTheDocument();
    expect(screen.getByText('6h 42')).toBeInTheDocument();
  });

  it('indique l’absence de séance sans afficher de graphique', async () => {
    await render(SportSplitCardComponent, { inputs: { split: { shares: [], totalLabel: '0 h' } } });

    expect(screen.getByText('Aucune séance sur cette période')).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Légende de la répartition' }),
    ).not.toBeInTheDocument();
  });

  it('affiche un état de chargement tant que la répartition n’est pas reçue', async () => {
    const { container } = await render(SportSplitCardComponent, {
      inputs: { split: undefined, loading: true },
    });

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(container.querySelector('section')).toHaveAttribute('aria-busy', 'true');
  });

  it('affiche son erreur avec un bouton Réessayer qui émet retry', async () => {
    const retry = vi.fn();
    await render(SportSplitCardComponent, {
      inputs: { split: undefined, errorMessage: 'Répartition indisponible' },
      on: { retry },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Répartition indisponible');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
