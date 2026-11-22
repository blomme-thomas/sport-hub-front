import { provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SESSIONS_API_URL } from '../../../../mocks/sessions.testing';
import { server } from '../../../../mocks/server';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { PlanningApi } from './planning.api';

const GENERATE_URL = `${SESSIONS_API_URL.replace(/\/sessions$/, '')}/planning/generate`;
const GOALS_URL = `${SESSIONS_API_URL.replace(/\/sessions$/, '')}/goals`;

function setup(): PlanningApi {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch()),
      { provide: API_BASE_URL, useValue: SESSIONS_API_URL.replace(/\/sessions$/, '') },
      PlanningApi,
    ],
  });
  return TestBed.inject(PlanningApi);
}

describe('PlanningApi', () => {
  it('envoie la période et l’objectif choisis à la génération', async () => {
    let body: unknown;
    server.use(
      http.post(GENERATE_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ from: '2026-11-09', to: '2026-11-15', items: [] });
      }),
    );

    await firstValueFrom(setup().generate({ from: '2026-11-09', goalId: 'goal-1' }));

    expect(body).toEqual({ from: '2026-11-09', goalId: 'goal-1' });
  });

  it('ne garde que les événements avec une date cible, par date croissante', async () => {
    server.use(
      http.get(GOALS_URL, () =>
        HttpResponse.json({
          items: [
            {
              id: 'b',
              title: 'Semi',
              type: 'evenement',
              targetDate: '2026-12-20',
              eventFormat: null,
              targetTimeSeconds: null,
            },
            {
              id: 'v',
              title: 'Volume',
              type: 'volume',
              targetDate: '2026-11-30',
              eventFormat: null,
              targetTimeSeconds: null,
            },
            {
              id: 'a',
              title: 'Trail',
              type: 'evenement',
              targetDate: '2026-11-25',
              eventFormat: null,
              targetTimeSeconds: null,
            },
            {
              id: 'n',
              title: 'Sans date',
              type: 'evenement',
              targetDate: null,
              eventFormat: null,
              targetTimeSeconds: null,
            },
          ],
        }),
      ),
    );

    const events = await firstValueFrom(setup().listEvents());

    expect(events.map((event) => event.id)).toEqual(['a', 'b']);
  });
});
