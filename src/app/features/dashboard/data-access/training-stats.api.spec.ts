import { HttpErrorResponse, provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { normalStatsResponse } from '../../../../mocks/fixtures/training-stats.fixtures';
import { API_URL, problemResponse, trackStats } from '../../../../mocks/training-stats.testing';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { TrainingStatsApi } from './training-stats.api';

const QUERY = { granularity: 'week' as const, from: '2026-09-14', to: '2026-11-08' };

function setup(): TrainingStatsApi {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch()),
      { provide: API_BASE_URL, useValue: API_URL },
      TrainingStatsApi,
    ],
  });
  return TestBed.inject(TrainingStatsApi);
}

describe('TrainingStatsApi', () => {
  it('interroge GET /api/stats avec la granularité et la plage demandées', async () => {
    const requests = trackStats();

    await firstValueFrom(setup().get(QUERY));

    expect(requests).toHaveLength(1);
    expect(requests[0]?.pathname).toBe('/api/stats');
    expect(requests[0]?.searchParams.get('granularity')).toBe('week');
    expect(requests[0]?.searchParams.get('from')).toBe('2026-09-14');
    expect(requests[0]?.searchParams.get('to')).toBe('2026-11-08');
  });

  it('n ajoute pas de paramètre type quand aucun type n est demandé', async () => {
    const requests = trackStats();

    await firstValueFrom(setup().get(QUERY));

    expect(requests[0]?.searchParams.has('type')).toBe(false);
  });

  it('renvoie la réponse du back telle quelle, sans transformation', async () => {
    trackStats();

    const response = await firstValueFrom(setup().get(QUERY));

    expect(response).toEqual(normalStatsResponse);
  });

  it('propage l erreur HTTP 400 sans la transformer', async () => {
    trackStats(() => problemResponse(400, 'STATS_RANGE_TOO_LARGE'));

    const result = firstValueFrom(setup().get(QUERY));

    await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    await expect(result).rejects.toMatchObject({ status: 400 });
  });
});
