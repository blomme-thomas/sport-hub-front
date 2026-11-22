import { provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SESSIONS_API_URL } from '../../../../mocks/sessions.testing';
import { server } from '../../../../mocks/server';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { PausesApi } from './pauses.api';

const BASE_URL = SESSIONS_API_URL.replace(/\/sessions$/, '');
const PAUSES_URL = `${BASE_URL}/pauses`;

function setup(): PausesApi {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch()),
      { provide: API_BASE_URL, useValue: BASE_URL },
      PausesApi,
    ],
  });
  return TestBed.inject(PausesApi);
}

describe('PausesApi', () => {
  it('demande les pauses de la période en from et to', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(PAUSES_URL, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json([]);
      }),
    );

    await firstValueFrom(setup().list('2026-11-09', '2026-11-15'));

    expect(query?.get('from')).toBe('2026-11-09');
    expect(query?.get('to')).toBe('2026-11-15');
  });

  it('envoie la pause créée au back', async () => {
    let body: unknown;
    server.use(
      http.post(PAUSES_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          id: 'p1',
          startDate: '2026-12-20',
          endDate: '2027-01-05',
          reason: 'blessure',
        });
      }),
    );

    await firstValueFrom(
      setup().create({ startDate: '2026-12-20', endDate: '2027-01-05', reason: 'blessure' }),
    );

    expect(body).toEqual({ startDate: '2026-12-20', endDate: '2027-01-05', reason: 'blessure' });
  });
});
