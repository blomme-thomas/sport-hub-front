import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import { RecentActivitiesApi } from './recent-activities.api';
import { TrainingMonthState } from './training-month.state';

const LIST_URL = '*/api/activities';

function activityOn(id: string, startedAt: Date) {
  return {
    id,
    garminActivityId: `g-${id}`,
    type: 'running',
    startedAt: startedAt.toISOString(),
    durationSeconds: 2700,
    distanceMeters: 8000,
    averageHeartRate: 150,
  };
}

function setup(): TrainingMonthState {
  TestBed.configureTestingModule({
    providers: [...statsTestProviders(), RecentActivitiesApi, TrainingMonthState],
  });
  return TestBed.inject(TrainingMonthState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

describe('TrainingMonthState', () => {
  beforeEach(() => {
    // Mercredi 11 novembre 2026, heure locale : le mois affiché est novembre.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 11, 12, 0) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('charge les activités du mois et les range sur leur jour', async () => {
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(LIST_URL, ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json({
          items: [activityOn('a', new Date(2026, 10, 8, 10))],
          page: 1,
          pageSize: 100,
          total: 1,
        });
      }),
    );

    const state = setup();

    await settle(() => expect(state.isLoading()).toBe(false));
    expect(state.title()).toBe('Novembre 2026');
    expect(queries[0]?.get('from')).toBe('2026-11-01');
    expect(queries[0]?.get('to')).toBe('2026-12-01');
    const day = state
      .weeks()
      .flat()
      .find((item) => item.date === '2026-11-08');
    expect(day?.activities.map((activity) => activity.typeLabel)).toEqual(['Course à pied']);
  });

  it('ignore une activité de la semaine voisine renvoyée par l’API', async () => {
    server.use(
      http.get(LIST_URL, () =>
        HttpResponse.json({
          items: [activityOn('hors-mois', new Date(2026, 9, 31, 20))],
          page: 1,
          pageSize: 100,
          total: 1,
        }),
      ),
    );

    const state = setup();

    await settle(() => expect(state.isLoading()).toBe(false));
    expect(
      state
        .weeks()
        .flat()
        .every((day) => day.activities.length === 0),
    ).toBe(true);
  });

  it('change de mois et recharge la période correspondante', async () => {
    const froms: string[] = [];
    server.use(
      http.get(LIST_URL, ({ request }) => {
        froms.push(new URL(request.url).searchParams.get('from') ?? '');
        return HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 });
      }),
    );
    const state = setup();
    await settle(() => expect(state.isEmpty()).toBe(true));

    state.previous();

    await settle(() => expect(state.title()).toBe('Octobre 2026'));
    await settle(() => expect(froms).toContain('2026-10-01'));
  });
});
