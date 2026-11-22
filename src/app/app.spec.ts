import { render, screen } from '@testing-library/angular';
import { statsTestProviders, trackStats } from '../mocks/training-stats.testing';
import { routes } from './app.routes';
import { App } from './app';

vi.mock('chart.js', async () => (await import('../mocks/chart-js.fake')).chartJsModule);

describe('App', () => {
  it("affiche la coque et le tableau de bord sur la page d'accueil", async () => {
    trackStats();

    await render(App, { routes, providers: statsTestProviders() });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sport Hub' })).toBeInTheDocument();
  });
});
