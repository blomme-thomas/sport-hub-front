import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import type { DashboardKpi } from '../models/dashboard-kpi.model';
import { KpiCardComponent } from './kpi-card.component';

const duration: DashboardKpi = {
  id: 'duration',
  label: 'Durée totale',
  value: '6h 42',
  unit: null,
  tone: 'success',
  variation: { label: 'En hausse', text: '+12,5 %', direction: 'up' },
  series: [0, 2700, 4800],
};

const elevation: DashboardKpi = {
  id: 'elevation',
  label: 'Dénivelé positif',
  value: '435',
  unit: 'm',
  tone: 'violet',
  variation: null,
  series: null,
};

describe('KpiCardComponent', () => {
  it('affiche le libellé, la valeur, son unité et la variation quand elle existe', async () => {
    await render(KpiCardComponent, { inputs: { kpi: duration } });

    expect(screen.getByRole('heading', { name: 'Durée totale' })).toBeInTheDocument();
    expect(screen.getByText('6h 42')).toBeInTheDocument();
    expect(screen.getByText('+12,5 %')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Durée totale sur la période' })).toBeInTheDocument();
  });

  it('n affiche ni variation ni mini-courbe sans données correspondantes', async () => {
    const { container } = await render(KpiCardComponent, { inputs: { kpi: elevation } });

    expect(screen.getByText('435')).toBeInTheDocument();
    expect(screen.getByText('m')).toBeInTheDocument();
    expect(container.querySelector('sh-variation-badge')).toBeNull();
    expect(container.querySelector('sh-chart')).toBeNull();
  });
});
