import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { adviceApi } from '../../../../mocks/fixtures/dashboard-advice.fixtures';
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

describe('DashboardAdviceState', () => {
  it('charge le conseil stocké sans déclencher de génération', async () => {
    const calls: string[] = [];
    server.use(
      http.get(ADVICE_URL, () => {
        calls.push('GET');
        return HttpResponse.json(adviceApi);
      }),
      http.post(REGENERATE_URL, () => {
        calls.push('POST');
        return HttpResponse.json(adviceApi, { status: 201 });
      }),
    );

    const state = setup();

    await settle(() => expect(state.advice()).not.toBeNull());
    expect(state.advice()?.text).toBe(adviceApi.text);
    expect(calls).toEqual(['GET']);
  });

  it('traite l’absence de conseil (404) comme un état à proposer, pas comme une erreur', async () => {
    server.use(http.get(ADVICE_URL, () => new HttpResponse(null, { status: 404 })));

    const state = setup();

    await settle(() => expect(state.loading()).toBe(false));
    expect(state.advice()).toBeNull();
    expect(state.errorMessage()).toBeNull();
  });

  it('régénère le conseil et remplace le texte affiché', async () => {
    let regenerated = false;
    server.use(
      http.get(ADVICE_URL, () => new HttpResponse(null, { status: 404 })),
      http.post(REGENERATE_URL, () => {
        regenerated = true;
        return HttpResponse.json(adviceApi, { status: 201 });
      }),
    );
    const state = setup();
    await settle(() => expect(state.loading()).toBe(false));

    await state.generate();

    expect(regenerated).toBe(true);
    expect(state.advice()?.text).toBe(adviceApi.text);
    expect(state.generating()).toBe(false);
  });

  it('expose l’erreur de génération sans perdre le conseil précédent', async () => {
    server.use(
      http.get(ADVICE_URL, () => HttpResponse.json(adviceApi)),
      http.post(REGENERATE_URL, () => new HttpResponse(null, { status: 503 })),
    );
    const state = setup();
    await settle(() => expect(state.advice()).not.toBeNull());

    await state.generate();

    expect(state.advice()?.text).toBe(adviceApi.text);
    expect(state.errorMessage()).not.toBeNull();
    expect(state.generating()).toBe(false);
  });
});
