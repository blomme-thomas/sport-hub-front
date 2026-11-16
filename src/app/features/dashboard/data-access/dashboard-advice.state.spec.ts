import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { dashboardAdviceApi } from '../../../../mocks/fixtures/dashboard-advice.fixtures';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import { DashboardAdviceApiService } from './dashboard-advice.api';
import { DashboardAdviceState } from './dashboard-advice.state';

const ADVICE_URL = '*/api/advice/dashboard';
const REGENERATE_URL = '*/api/advice/dashboard/regenerate';

function setup(): DashboardAdviceState {
  TestBed.configureTestingModule({
    providers: [...statsTestProviders(), DashboardAdviceApiService, DashboardAdviceState],
  });
  return TestBed.inject(DashboardAdviceState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

function problem(status: number, code: string) {
  return HttpResponse.json(
    { type: 'urn:test', title: 'Erreur', status, detail: 'Détail', code },
    { status, headers: { 'content-type': 'application/problem+json' } },
  );
}

describe('DashboardAdviceState', () => {
  it('charge le conseil stocké sans demander de génération', async () => {
    const requested: string[] = [];
    server.use(
      http.get(ADVICE_URL, () => {
        requested.push('GET');
        return HttpResponse.json(dashboardAdviceApi);
      }),
      http.post(REGENERATE_URL, () => {
        requested.push('POST');
        return HttpResponse.json(dashboardAdviceApi, { status: 201 });
      }),
    );

    const state = setup();

    await settle(() => expect(state.advice()?.text).toBe(dashboardAdviceApi.text));
    expect(requested).toEqual(['GET']);
  });

  it('traite une semaine sans conseil (404) comme un état normal, sans erreur', async () => {
    server.use(http.get(ADVICE_URL, () => problem(404, 'DASHBOARD_ADVICE_NOT_FOUND')));

    const state = setup();

    await settle(() => expect(state.isLoading()).toBe(false));
    expect(state.advice()).toBeNull();
    expect(state.errorMessage()).toBeNull();
  });

  it('expose l’erreur de lecture pour que la carte propose de réessayer', async () => {
    server.use(http.get(ADVICE_URL, () => problem(500, 'INTERNAL_ERROR')));

    const state = setup();

    await settle(() => expect(state.errorMessage()).not.toBeNull());
    expect(state.advice()).toBeNull();
  });

  it('régénère le conseil au clic et remplace le texte affiché', async () => {
    server.use(
      http.get(ADVICE_URL, () => problem(404, 'DASHBOARD_ADVICE_NOT_FOUND')),
      http.post(REGENERATE_URL, () =>
        HttpResponse.json({ ...dashboardAdviceApi, text: 'Nouveau conseil.' }, { status: 201 }),
      ),
    );

    const state = setup();
    await settle(() => expect(state.isLoading()).toBe(false));

    await state.regenerate();

    expect(state.advice()?.text).toBe('Nouveau conseil.');
    expect(state.generating()).toBe(false);
  });
});
