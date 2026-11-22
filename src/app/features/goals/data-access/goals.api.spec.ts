import { HttpErrorResponse, provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { triathlonApi, volumeUndatedApi } from '../../../../mocks/fixtures/goals.fixtures';
import {
  API_URL,
  GOALS_URL,
  problemResponse,
  trackGoalsList,
} from '../../../../mocks/goals.testing';
import { server } from '../../../../mocks/server';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { CreateGoalRequestApi, UpdateGoalRequestApi } from '../models/goal.api-model';
import type { Goal } from '../models/goal.model';
import { GoalsApi } from './goals.api';

const triathlon: Goal = {
  id: 'goal-triathlon',
  title: 'Triathlon de Paris',
  type: 'evenement',
  targetDate: '2026-12-06',
  eventFormat: 'olympique',
  targetTime: { hours: 2, minutes: 30, seconds: 0 },
};

const createBody: CreateGoalRequestApi = {
  title: 'Triathlon de Paris',
  type: 'evenement',
  targetDate: '2026-12-06',
  eventFormat: 'olympique',
  targetTimeSeconds: 9000,
};

function setup(): GoalsApi {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch()),
      { provide: API_BASE_URL, useValue: API_URL },
      GoalsApi,
    ],
  });
  return TestBed.inject(GoalsApi);
}

describe('GoalsApi', () => {
  it('interroge GET /api/goals sans paramètre upcoming', async () => {
    const requests = trackGoalsList();

    await firstValueFrom(setup().list());

    expect(requests).toHaveLength(1);
    expect(requests[0]?.pathname).toBe('/api/goals');
    expect(requests[0]?.searchParams.has('upcoming')).toBe(false);
  });

  it('mappe chaque objectif de la réponse en modèle UI', async () => {
    trackGoalsList(() => HttpResponse.json({ items: [triathlonApi, volumeUndatedApi] }));

    const goals = await firstValueFrom(setup().list());

    expect(goals).toEqual([
      triathlon,
      {
        id: 'goal-volume',
        title: 'Volume hebdomadaire',
        type: 'volume',
        targetDate: null,
        eventFormat: null,
        targetTime: null,
      },
    ]);
  });

  it('renvoie une liste vide quand aucun objectif n est enregistré', async () => {
    trackGoalsList(() => HttpResponse.json({ items: [] }));

    await expect(firstValueFrom(setup().list())).resolves.toEqual([]);
  });

  it('envoie POST /api/goals avec le corps de création et renvoie l objectif créé mappé', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(GOALS_URL, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(triathlonApi, { status: 201 });
      }),
    );

    const created = await firstValueFrom(setup().create(createBody));

    expect(bodies).toEqual([createBody]);
    expect(created).toEqual(triathlon);
  });

  it('envoie PATCH /api/goals/:id avec le corps complet y compris les null explicites', async () => {
    const requests: { method: string; pathname: string; body: unknown }[] = [];
    const body: UpdateGoalRequestApi = {
      title: 'Volume hebdomadaire',
      type: 'volume',
      targetDate: null,
      eventFormat: null,
      targetTimeSeconds: null,
    };
    server.use(
      http.patch(`${GOALS_URL}/:id`, async ({ request }) => {
        requests.push({
          method: request.method,
          pathname: new URL(request.url).pathname,
          body: await request.json(),
        });
        return HttpResponse.json(volumeUndatedApi);
      }),
    );

    await firstValueFrom(setup().update('goal-volume', body));

    expect(requests).toEqual([{ method: 'PATCH', pathname: '/api/goals/goal-volume', body }]);
  });

  it('envoie DELETE /api/goals/:id et termine sans corps sur 204', async () => {
    const requests: { method: string; pathname: string }[] = [];
    server.use(
      http.delete(`${GOALS_URL}/:id`, ({ request }) => {
        requests.push({ method: request.method, pathname: new URL(request.url).pathname });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(firstValueFrom(setup().delete('goal-triathlon'))).resolves.toBeNull();

    expect(requests).toEqual([{ method: 'DELETE', pathname: '/api/goals/goal-triathlon' }]);
  });

  it('propage l erreur de validation 400 sans la transformer', async () => {
    server.use(http.post(GOALS_URL, () => problemResponse(400, 'VALIDATION_FAILED')));

    const result = firstValueFrom(setup().create(createBody));

    await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    await expect(result).rejects.toMatchObject({ status: 400 });
  });
});
