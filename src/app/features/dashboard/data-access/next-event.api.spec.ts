import { TestBed } from '@angular/core/testing';
import { HttpResponse } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { semiPastApi, triathlonApi } from '../../../../mocks/fixtures/goals.fixtures';
import { goalsTestProviders, trackGoalsList } from '../../../../mocks/goals.testing';
import { NextEventApi } from './next-event.api';

function setup(): NextEventApi {
  TestBed.configureTestingModule({
    providers: [...goalsTestProviders(), NextEventApi],
  });
  return TestBed.inject(NextEventApi);
}

describe('NextEventApi', () => {
  it('interroge GET /api/goals une seule fois', async () => {
    const requests = trackGoalsList(() => HttpResponse.json({ items: [triathlonApi] }));

    await firstValueFrom(setup().list());

    expect(requests).toHaveLength(1);
    expect(requests[0]?.pathname).toBe('/api/goals');
  });

  it('renvoie la liste des objectifs de la réponse sans transformation', async () => {
    trackGoalsList(() => HttpResponse.json({ items: [triathlonApi, semiPastApi] }));

    await expect(firstValueFrom(setup().list())).resolves.toEqual([triathlonApi, semiPastApi]);
  });

  it('renvoie une liste vide quand aucun objectif n est enregistré', async () => {
    trackGoalsList(() => HttpResponse.json({ items: [] }));

    await expect(firstValueFrom(setup().list())).resolves.toEqual([]);
  });
});
