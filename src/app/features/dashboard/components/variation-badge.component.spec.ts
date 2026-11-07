import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import type { VariationView } from '../models/training-stats.model';
import { VariationBadgeComponent } from './variation-badge.component';

describe('VariationBadgeComponent', () => {
  it('affiche le texte signé d une hausse avec son libellé de sens', async () => {
    const variation: VariationView = {
      label: 'En hausse',
      text: '+1 séance (+33 %)',
      direction: 'up',
    };

    await render(VariationBadgeComponent, { inputs: { variation } });

    expect(screen.getByText('+1 séance (+33 %)')).toBeInTheDocument();
    expect(screen.getByText('En hausse')).toBeInTheDocument();
  });

  it('affiche le texte signé d une baisse avec son libellé de sens', async () => {
    const variation: VariationView = {
      label: 'En baisse',
      text: '−1 séance (−25 %)',
      direction: 'down',
    };

    await render(VariationBadgeComponent, { inputs: { variation } });

    expect(screen.getByText('−1 séance (−25 %)')).toBeInTheDocument();
    expect(screen.getByText('En baisse')).toBeInTheDocument();
  });

  it('affiche une variation nulle comme stable', async () => {
    const variation: VariationView = { label: 'Stable', text: '0 séance (0 %)', direction: 'flat' };

    await render(VariationBadgeComponent, { inputs: { variation } });

    expect(screen.getByText('0 séance (0 %)')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('affiche le texte n/a sans signe quand la variation n est pas comparable', async () => {
    const variation: VariationView = {
      label: 'Non comparable',
      text: 'n/a',
      direction: 'unknown',
    };

    await render(VariationBadgeComponent, { inputs: { variation } });

    expect(screen.getByText('n/a')).toBeInTheDocument();
    expect(screen.getByText('Non comparable')).toBeInTheDocument();
  });
});
