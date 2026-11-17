import { render, screen, within } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import type { CardDetail } from '../../models/card-detail.model';
import { CardDetailModalComponent } from './card-detail-modal.component';

async function renderWith(detail: CardDetail) {
  await render(CardDetailModalComponent, {
    providers: [{ provide: NZ_MODAL_DATA, useValue: { detail } }],
  });
}

describe('CardDetailModalComponent', () => {
  it('affiche la valeur et la variation d’un indicateur', async () => {
    await renderWith({
      kind: 'kpi',
      title: 'Durée',
      value: '6h 42',
      unit: null,
      variation: { label: 'Durée', text: '+12 %', direction: 'up' },
    });

    expect(screen.getByText('6h 42')).toBeInTheDocument();
    expect(screen.queryByText(/Variation par rapport/)).not.toBeInTheDocument();
  });

  it('indique l’absence de variation quand le back n’en fournit pas', async () => {
    await renderWith({ kind: 'kpi', title: 'Séances', value: '4', unit: null, variation: null });

    expect(
      screen.getByText(/Variation par rapport à la période précédente : —/),
    ).toBeInTheDocument();
  });

  it('liste la durée et la part de chaque sport', async () => {
    await renderWith({
      kind: 'split',
      title: 'Répartition par sport',
      totalLabel: '6h 42',
      rows: [
        {
          label: 'Course à pied',
          percent: 70,
          durationLabel: '4h 42',
          colorVariable: '--sh-accent-text',
        },
        { label: 'Cyclisme', percent: 30, durationLabel: '2h 00', colorVariable: '--sh-success' },
      ],
    });

    const table = screen.getByRole('table', { name: 'Répartition détaillée par sport' });
    expect(within(table).getByText('4h 42')).toBeInTheDocument();
    expect(within(table).getByText('30 %')).toBeInTheDocument();
  });

  it('liste le temps, la part et le seuil de chaque zone, sans seuil quand il manque', async () => {
    await renderWith({
      kind: 'zones',
      title: 'Zones d’entraînement',
      optimalPercent: 60,
      statusMessage: 'Bon équilibre en zone optimale',
      rows: [
        {
          label: 'Z2',
          name: 'Endurance',
          percent: 60,
          durationLabel: '1h 30',
          floorBpm: 120,
          colorVariable: '--sh-success',
        },
        {
          label: 'Z5',
          name: 'Puissance',
          percent: 0,
          durationLabel: '0 min',
          floorBpm: null,
          colorVariable: '--sh-violet',
        },
      ],
    });

    const table = screen.getByRole('table', {
      name: 'Temps passé par zone de fréquence cardiaque',
    });
    expect(within(table).getByText('à partir de 120 bpm')).toBeInTheDocument();
    expect(within(table).getByText('1h 30')).toBeInTheDocument();
    expect(screen.getByText(/Bon équilibre en zone optimale/)).toBeInTheDocument();
  });

  it('affiche un état vide sans données', async () => {
    await renderWith({
      kind: 'split',
      title: 'Répartition par sport',
      totalLabel: '0 min',
      rows: [],
    });

    expect(screen.getByText('Aucune séance sur cette période')).toBeInTheDocument();
  });
});
