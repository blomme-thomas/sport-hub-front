import { provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SESSIONS_API_URL, SESSIONS_URL } from '../../../../mocks/sessions.testing';
import { server } from '../../../../mocks/server';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import { SessionOccurrencesApi } from './session-occurrences.api';

function setup(): SessionOccurrencesApi {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch()),
      { provide: API_BASE_URL, useValue: SESSIONS_API_URL },
      SessionOccurrencesApi,
    ],
  });
  return TestBed.inject(SessionOccurrencesApi);
}

describe('SessionOccurrencesApi', () => {
  it('demande les occurrences de la période en from et to', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(SESSIONS_URL, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json({ items: [] });
      }),
    );

    await firstValueFrom(setup().list('2026-11-09', '2026-11-15'));

    expect(query?.get('from')).toBe('2026-11-09');
    expect(query?.get('to')).toBe('2026-11-15');
  });

  it('écarte les séances sans heure, qui ne se placent pas sur la grille', async () => {
    server.use(
      http.get(SESSIONS_URL, () =>
        HttpResponse.json({
          items: [
            {
              sessionId: 'session-avec-heure',
              date: '2026-11-12',
              startTime: '18:00',
              durationMinutes: 45,
              disciplineTypeKey: 'running',
              recurrence: 'aucune',
              status: 'planifiee',
            },
            {
              sessionId: 'session-sans-heure',
              date: '2026-11-12',
              startTime: null,
              durationMinutes: 30,
              disciplineTypeKey: 'running',
              recurrence: 'aucune',
              status: 'planifiee',
            },
          ],
        }),
      ),
    );

    const occurrences = await firstValueFrom(setup().list('2026-11-09', '2026-11-15'));

    expect(occurrences.map((occurrence) => occurrence.id)).toEqual(['session-avec-heure']);
  });
});
