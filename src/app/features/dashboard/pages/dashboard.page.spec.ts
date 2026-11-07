import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import {
  emptyStatsResponse,
  normalStatsResponse,
} from '../../../../mocks/fixtures/training-stats.fixtures';
import { chartJsInstances } from '../../../../mocks/chart-js.fake';
import { server } from '../../../../mocks/server';
import {
  STATS_URL,
  problemResponse,
  statsTestProviders,
  trackStats,
} from '../../../../mocks/training-stats.testing';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import { toDashboardView } from '../data-access/training-stats.mapper';
import { DashboardPage } from './dashboard.page';

vi.mock('chart.js', async () => (await import('../../../../mocks/chart-js.fake')).chartJsModule);

const view = toDashboardView(normalStatsResponse);
const SESSIONS_TITLE = view.charts.sessions.title;
const DURATION_TITLE = view.charts.duration.title;
const BY_TYPE_TITLE = view.charts.byType.title;

describe('DashboardPage', () => {
  it('affiche le titre de la page Tableau de bord', async () => {
    trackStats();

    await render(DashboardPage, { providers: statsTestProviders() });

    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeInTheDocument();
  });

  it('signale le chargement tant que la réponse n est pas reçue', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    trackStats(async () => {
      await gate;
      return HttpResponse.json(normalStatsResponse);
    });

    const { container } = await render(DashboardPage, { providers: statsTestProviders() });

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();

    release();

    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    });
  });

  it('affiche le nombre et la durée des séances de la dernière période', async () => {
    trackStats();

    await render(DashboardPage, { providers: statsTestProviders() });

    expect(await screen.findByText(/4 séances?/)).toBeInTheDocument();
    expect(screen.getByText(/2[,.]5\s*h/)).toBeInTheDocument();
  });

  it('affiche la variation signée par rapport à la période précédente', async () => {
    trackStats();

    await render(DashboardPage, { providers: statsTestProviders() });

    expect(await screen.findByText(/^\+1\b/)).toBeInTheDocument();
  });

  it('affiche la répartition par type d activité', async () => {
    trackStats();

    await render(DashboardPage, { providers: statsTestProviders() });

    expect((await screen.findAllByText('running')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('cycling')).length).toBeGreaterThan(0);
  });

  it('affiche les graphiques d évolution et de répartition, chacun nommé par son titre', async () => {
    trackStats();

    await render(DashboardPage, { providers: statsTestProviders() });

    expect(await screen.findByRole('img', { name: SESSIONS_TITLE })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: DURATION_TITLE })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: BY_TYPE_TITLE })).toBeInTheDocument();
    expect(chartJsInstances).toHaveLength(3);
  });

  it('relance la requête en granularité mois et coche Mois quand l utilisateur bascule', async () => {
    const requests = trackStats();
    await render(DashboardPage, { providers: statsTestProviders() });
    await screen.findByRole('img', { name: SESSIONS_TITLE });

    await userEvent.click(screen.getByRole('radio', { name: 'Mois' }));

    await waitFor(() => {
      expect(requests.at(-1)?.searchParams.get('granularity')).toBe('month');
    });
    expect(requests[0]?.searchParams.get('granularity')).toBe('week');
    expect(screen.getByRole('radio', { name: 'Mois' })).toBeChecked();
  });

  it('affiche un état vide explicite et aucune carte quand aucune activité n est enregistrée', async () => {
    trackStats(() => HttpResponse.json(emptyStatsResponse));

    await render(DashboardPage, { providers: statsTestProviders() });

    expect(await screen.findByText('Aucune activité sur cette période')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Agrandir le graphique/ })).not.toBeInTheDocument();
  });

  it('affiche une erreur avec un bouton Réessayer qui relance la requête', async () => {
    let calls = 0;
    trackStats(() => {
      calls += 1;
      return calls === 1
        ? problemResponse(500, 'INTERNAL_ERROR')
        : HttpResponse.json(normalStatsResponse);
    });
    await render(DashboardPage, { providers: statsTestProviders() });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(ERROR_MESSAGES['INTERNAL_ERROR']);

    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByRole('img', { name: SESSIONS_TITLE })).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('affiche une erreur quand l API répond 500 sans corps problem+json', async () => {
    server.use(http.get(STATS_URL, () => new HttpResponse(null, { status: 500 })));
    await render(DashboardPage, { providers: statsTestProviders() });

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_MESSAGES['INVALID_RESPONSE']);
  });
});
