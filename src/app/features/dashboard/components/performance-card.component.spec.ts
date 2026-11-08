import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { PerformanceCardComponent } from './performance-card.component';

describe('PerformanceCardComponent', () => {
  it('affiche le titre, le maximum de la période et le graphique nommé', async () => {
    await render(PerformanceCardComponent, { providers: statsTestProviders() });

    expect(await screen.findByRole('heading', { name: 'Vos performances' })).toBeInTheDocument();
    expect(await screen.findByText('Maximum : 3h 37min le 7 nov.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Durée par jour sur la période' })).toBeInTheDocument();
  });

  it('propose les quatre périodes dans le sélecteur local', async () => {
    await render(PerformanceCardComponent, { providers: statsTestProviders() });

    expect(await screen.findByRole('heading', { name: 'Vos performances' })).toBeInTheDocument();
    expect(screen.getByLabelText('Période des performances')).toBeInTheDocument();
  });
});
