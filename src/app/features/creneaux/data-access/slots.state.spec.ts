import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionsTestProviders } from '../../../../mocks/sessions.testing';
import { server } from '../../../../mocks/server';
import { SlotsState } from './slots.state';

const SESSIONS_URL = '*/api/sessions';

function setup(): SlotsState {
  TestBed.configureTestingModule({ providers: [...sessionsTestProviders(), SlotsState] });
  return TestBed.inject(SlotsState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

function sessionOccurrence(sessionId: string, date: string, startTime: string | null) {
  return {
    sessionId,
    date,
    startTime,
    durationMinutes: 45,
    disciplineTypeKey: 'running',
    recurrence: 'aucune',
    status: 'planifiee',
  };
}

/** Intercepte les appels de la semaine et enregistre les périodes demandées aux séances. */
function trackSessions(
  respond: () => Response | Promise<Response> = () => HttpResponse.json({ items: [] }),
): URL[] {
  const requests: URL[] = [];
  server.use(
    http.get(SESSIONS_URL, ({ request }) => {
      requests.push(new URL(request.url));
      return respond();
    }),
    http.get('*/api/disciplines', () =>
      HttpResponse.json({ items: [{ typeKey: 'running', label: 'Course à pied' }] }),
    ),
  );
  return requests;
}

describe('SlotsState (calendrier)', () => {
  beforeEach(() => {
    // Samedi 7 novembre 2026, midi locale : la semaine courante va du 2 au 8 novembre.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 7, 12, 0) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('charge les séances de la semaine du jour, du lundi au dimanche', async () => {
    const requests = trackSessions();

    const state = setup();

    await settle(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.searchParams.get('from')).toBe('2026-11-02');
    expect(requests[0]?.searchParams.get('to')).toBe('2026-11-08');
    expect(state.weekStart()).toBe('2026-11-02');
    expect(state.weekEnd()).toBe('2026-11-08');
  });

  it('range les séances dans le jour auquel elles appartiennent, sans créneaux', async () => {
    trackSessions(() =>
      HttpResponse.json({
        items: [
          sessionOccurrence('session-a', '2026-11-03', '18:00'),
          sessionOccurrence('session-b', '2026-11-03', null),
        ],
      }),
    );

    const state = setup();

    await settle(() => expect(state.isLoading()).toBe(false));
    const tuesday = state.days().find((day) => day.date === '2026-11-03');
    expect(tuesday?.sessions.map((session) => session.id)).toEqual(['session-a']);
    expect(tuesday?.slots).toEqual([]);
    expect(state.days()).toHaveLength(7);
  });

  it('propose la discipline des séances dans la légende', async () => {
    trackSessions(() =>
      HttpResponse.json({ items: [sessionOccurrence('session-a', '2026-11-03', '18:00')] }),
    );

    const state = setup();

    await settle(() => expect(state.legend()).toHaveLength(1));
    expect(state.legend()[0]?.label).toBe('Course à pied');
  });

  it('passe à la semaine suivante et la recharge', async () => {
    const requests = trackSessions();
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    state.nextWeek();

    await settle(() => expect(requests).toHaveLength(2));
    expect(requests[1]?.searchParams.get('from')).toBe('2026-11-09');
    expect(state.weekStart()).toBe('2026-11-09');
  });

  it('ignore la réponse d’une semaine déjà quittée', async () => {
    let releaseFirst!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let calls = 0;
    trackSessions(async () => {
      calls += 1;
      if (calls === 1) {
        await gate;
        return HttpResponse.json({
          items: [sessionOccurrence('session-ancienne', '2026-11-03', '09:00')],
        });
      }
      return HttpResponse.json({
        items: [sessionOccurrence('session-nouvelle', '2026-11-10', '09:00')],
      });
    });

    const state = setup();
    await settle(() => expect(calls).toBe(1));
    state.nextWeek();
    await settle(() => expect(state.isLoading()).toBe(false));

    releaseFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    const ids = state.days().flatMap((day) => day.sessions.map((session) => session.id));
    expect(ids).toEqual(['session-nouvelle']);
  });

  it('expose une erreur de chargement et vide la semaine', async () => {
    trackSessions(() => new HttpResponse(null, { status: 500 }));

    const state = setup();

    await settle(() => expect(state.error()).not.toBeNull());
    expect(state.error()?.status).toBe(500);
    expect(state.days().every((day) => day.sessions.length === 0)).toBe(true);
  });
});
