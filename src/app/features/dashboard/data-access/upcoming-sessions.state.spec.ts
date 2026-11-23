import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { UpcomingSessionsApi } from './upcoming-sessions.api';
import { UpcomingSessionsState } from './upcoming-sessions.state';
import { WeekSessionsApi } from './week-sessions.api';

const DISCIPLINES = {
  items: [
    {
      typeKey: 'running',
      label: 'Course à pied',
      family: 'running',
      firstSeenAt: '',
      lastSeenAt: '',
    },
  ],
};

function occurrence(sessionId: string, date: string, startTime: string, status = 'planifiee') {
  return {
    sessionId,
    title: null,
    date,
    startTime,
    durationMinutes: 45,
    disciplineTypeKey: 'running',
    recurrence: 'aucune',
    status,
  };
}

function setup(): UpcomingSessionsState {
  TestBed.configureTestingModule({
    providers: [
      ...statsTestProviders(),
      UpcomingSessionsApi,
      WeekSessionsApi,
      UpcomingSessionsState,
    ],
  });
  return TestBed.inject(UpcomingSessionsState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

describe('UpcomingSessionsState', () => {
  it('demande les séances d’aujourd’hui sur une fenêtre de 366 jours', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get('*/api/sessions/disciplines', () => HttpResponse.json(DISCIPLINES)),
      http.get('*/api/sessions', ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json({ items: [] });
      }),
    );

    const state = setup();
    await settle(() => expect(state.sessions()).toEqual([]));

    const today = localIsoDate();
    expect(query?.get('from')).toBe(today);
    expect(query?.get('to')).toBe(addIsoDays(today, 365));
  });

  it('ne garde que les séances planifiées, triées par date puis par heure', async () => {
    const today = localIsoDate();
    server.use(
      http.get('*/api/sessions/disciplines', () => HttpResponse.json(DISCIPLINES)),
      http.get('*/api/sessions', () =>
        HttpResponse.json({
          items: [
            occurrence('tardive', addIsoDays(today, 3), '07:00'),
            occurrence('realisee', addIsoDays(today, 1), '08:00', 'realisee'),
            occurrence('matin', addIsoDays(today, 1), '06:30'),
            occurrence('soir', addIsoDays(today, 1), '18:00'),
          ],
        }),
      ),
    );

    const state = setup();
    await settle(() => expect(state.sessions()?.length).toBe(3));

    expect(state.sessions()?.map((session) => session.id)).toEqual(['matin', 'soir', 'tardive']);
    expect(state.sessions()?.[0]).toMatchObject({
      timeLabel: '06:30',
      typeLabel: 'Course à pied',
      durationLabel: '45 min',
    });
  });

  it('se limite aux vingt prochaines séances', async () => {
    const today = localIsoDate();
    const items = Array.from({ length: 25 }, (_, index) =>
      occurrence(`s${index}`, addIsoDays(today, index), '09:00'),
    );
    server.use(
      http.get('*/api/sessions/disciplines', () => HttpResponse.json(DISCIPLINES)),
      http.get('*/api/sessions', () => HttpResponse.json({ items })),
    );

    const state = setup();
    await settle(() => expect(state.sessions()).toHaveLength(20));

    expect(state.sessions()?.at(-1)?.id).toBe('s19');
  });
});
