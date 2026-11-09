import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import type { SportSplitView } from '../models/sport-split.model';
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
});
