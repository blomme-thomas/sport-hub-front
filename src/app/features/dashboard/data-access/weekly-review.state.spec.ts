import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { weeklyReviewApi } from '../../../../mocks/fixtures/weekly-review.fixtures';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import { WeeklyReviewApiService } from './weekly-review.api';
import { WeeklyReviewState } from './weekly-review.state';

const REVIEW_URL = '*/api/weekly-reviews/:week';

function setup(): WeeklyReviewState {
  TestBed.configureTestingModule({
    providers: [...statsTestProviders(), WeeklyReviewApiService, WeeklyReviewState],
  });
  return TestBed.inject(WeeklyReviewState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

describe('WeeklyReviewState', () => {
  beforeEach(() => {
    // Mercredi 11 novembre 2026 : la semaine courante est 2026-W46.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 11, 12, 0) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('charge le bilan de la semaine courante', async () => {
    const requests: string[] = [];
    server.use(
      http.get(REVIEW_URL, ({ params }) => {
        requests.push(String(params['week']));
        return HttpResponse.json(weeklyReviewApi);
      }),
    );

    const state = setup();

    await settle(() => expect(state.review()).not.toBeNull());
    expect(requests).toEqual(['2026-W46']);
    expect(state.weekLabel()).toBe('Semaine du 9 novembre 2026 au 15 novembre 2026');
    expect(state.review()?.generic).toBe(false);
  });

  it('traite une semaine sans bilan comme un état à proposer, pas comme une erreur', async () => {
    server.use(http.get(REVIEW_URL, () => new HttpResponse(null, { status: 404 })));

    const state = setup();

    await settle(() => expect(state.missing()).toBe(true));
    expect(state.error()).toBeNull();
    expect(state.review()).toBeNull();
  });

  it('expose une erreur autre qu’un 404', async () => {
    server.use(http.get(REVIEW_URL, () => new HttpResponse(null, { status: 500 })));

    const state = setup();

    await settle(() => expect(state.error()).not.toBeNull());
    expect(state.error()?.status).toBe(500);
    expect(state.missing()).toBe(false);
  });

  it('génère le bilan d’une semaine sans bilan', async () => {
    server.use(
      http.get(REVIEW_URL, () => new HttpResponse(null, { status: 404 })),
      http.post(REVIEW_URL, () => HttpResponse.json(weeklyReviewApi, { status: 201 })),
    );
    const state = setup();
    await settle(() => expect(state.missing()).toBe(true));

    await state.generate();

    expect(state.review()?.suivi).toBe(weeklyReviewApi.suivi);
    expect(state.generating()).toBe(false);
  });

  it('change de semaine et recharge le bilan de la semaine précédente', async () => {
    const requests: string[] = [];
    server.use(
      http.get(REVIEW_URL, ({ params }) => {
        requests.push(String(params['week']));
        return new HttpResponse(null, { status: 404 });
      }),
    );
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    state.previousWeek();

    await settle(() => expect(requests).toEqual(['2026-W46', '2026-W45']));
    expect(state.week()).toBe('2026-W45');
  });
});
