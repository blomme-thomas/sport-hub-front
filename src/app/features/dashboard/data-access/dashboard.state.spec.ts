import { TestBed } from '@angular/core/testing';
import { HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emptyStatsResponse,
  normalStatsResponse,
} from '../../../../mocks/fixtures/training-stats.fixtures';
import {
  problemResponse,
  statsTestProviders,
  trackStats,
} from '../../../../mocks/training-stats.testing';
import { AppError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import { DashboardState } from './dashboard.state';
import { TrainingStatsApi } from './training-stats.api';

function setup(): DashboardState {
  TestBed.configureTestingModule({
    providers: [...statsTestProviders(), TrainingStatsApi, DashboardState],
  });
  return TestBed.inject(DashboardState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

describe('DashboardState', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-04T10:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('démarre sur la période 7 jours, en granularité semaine', async () => {
    const state = setup();

    expect(state.period()).toBe('7d');
    expect(state.granularity()).toBe('week');
    await settle(() => expect(state.view()).toBeDefined());
  });

  it('demande les 8 dernières semaines ISO en UTC, jusqu à la fin de la semaine courante', async () => {
    const requests = trackStats();

    const state = setup();
    await settle(() => expect(state.view()).toBeDefined());

    expect(requests[0]?.searchParams.get('granularity')).toBe('week');
    expect(requests[0]?.searchParams.get('from')).toBe('2026-09-14');
    expect(requests[0]?.searchParams.get('to')).toBe('2026-11-08');
  });

  it('demande les 6 derniers mois en UTC, jusqu à la fin du mois courant, pour la période 3 mois', async () => {
    const requests = trackStats();
    const state = setup();
    await settle(() => expect(state.view()).toBeDefined());

    state.setPeriod('3m');

    await settle(() => expect(requests.at(-1)?.searchParams.get('granularity')).toBe('month'));
    expect(requests.at(-1)?.searchParams.get('from')).toBe('2026-06-01');
    expect(requests.at(-1)?.searchParams.get('to')).toBe('2026-11-30');
  });

  it('expose la période choisie dans la vue et la granularité qui en découle', async () => {
    trackStats();
    const state = setup();
    await settle(() => expect(state.view()).toBeDefined());

    state.setPeriod('1y');

    expect(state.granularity()).toBe('month');
    await settle(() => expect(state.view()?.period).toBe('1y'));
  });

  it('ne recharge pas les statistiques quand la période change sans changer de granularité', async () => {
    const requests = trackStats();
    const state = setup();
    await settle(() => expect(state.view()).toBeDefined());

    state.setPeriod('30d');

    await settle(() => expect(state.view()?.period).toBe('30d'));
    expect(requests).toHaveLength(1);
  });

  it('expose l état de chargement pendant la requête puis le termine', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests = trackStats(async () => {
      await gate;
      return HttpResponse.json(normalStatsResponse);
    });

    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    expect(state.isLoading()).toBe(true);
    expect(state.isEmpty()).toBe(false);

    release();

    await settle(() => expect(state.isLoading()).toBe(false));
    expect(state.view()).toBeDefined();
  });

  it('expose une AppError typée et pas de vue quand l API renvoie une erreur', async () => {
    trackStats(() => problemResponse(500, 'INTERNAL_ERROR'));

    const state = setup();
    await settle(() => expect(state.error()).not.toBeNull());

    expect(state.error()).toBeInstanceOf(AppError);
    expect(state.error()?.code).toBe('INTERNAL_ERROR');
    expect(state.error()?.userMessage).toContain(ERROR_MESSAGES['INTERNAL_ERROR']);
    expect(state.view()).toBeUndefined();
    expect(state.isLoading()).toBe(false);
  });

  it('relance la requête au rechargement après une erreur et efface l erreur', async () => {
    let calls = 0;
    const requests = trackStats(() => {
      calls += 1;
      return calls === 1
        ? problemResponse(500, 'INTERNAL_ERROR')
        : HttpResponse.json(normalStatsResponse);
    });
    const state = setup();
    await settle(() => expect(state.error()).not.toBeNull());

    state.reload();

    await settle(() => expect(state.view()).toBeDefined());
    expect(state.error()).toBeNull();
    expect(requests).toHaveLength(2);
  });

  it('signale un ensemble vide quand aucune période ne contient de séance', async () => {
    trackStats(() => HttpResponse.json(emptyStatsResponse));

    const state = setup();
    await settle(() => expect(state.view()).toBeDefined());

    expect(state.isEmpty()).toBe(true);
  });

  it('ne signale pas d ensemble vide dès qu une période contient une séance', async () => {
    trackStats();

    const state = setup();
    await settle(() => expect(state.view()).toBeDefined());

    expect(state.isEmpty()).toBe(false);
  });
});
