import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { DashboardKpisState } from '../data-access/dashboard-kpis.state';
import { DashboardState } from '../data-access/dashboard.state';
import { PerformanceState } from '../data-access/performance.state';
import { PerformanceCardComponent } from './performance-card.component';

describe('PerformanceCardComponent', () => {
  it('affiche le titre et le graphique nommé', async () => {
    await render(PerformanceCardComponent, {
      providers: [...statsTestProviders(), DashboardState, DashboardKpisState, PerformanceState],
    });

    expect(await screen.findByRole('heading', { name: 'Performances' })).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: 'Durée par jour sur la période' }),
    ).toBeInTheDocument();
  });

  it('n’affiche pas de sélecteur de période dans la carte', async () => {
    await render(PerformanceCardComponent, {
      providers: [...statsTestProviders(), DashboardState, DashboardKpisState, PerformanceState],
    });

    expect(await screen.findByRole('heading', { name: 'Performances' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Période des performances')).not.toBeInTheDocument();
  });
});
