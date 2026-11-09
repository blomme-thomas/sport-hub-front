import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { libreMardiApi, occupeLundiHebdoApi } from '../../../../mocks/fixtures/slots.fixtures';
import {
  SLOTS_URL,
  slotsTestProviders,
  slotValidationProblem,
  trackSlotsList,
} from '../../../../mocks/slots.testing';
import { server } from '../../../../mocks/server';
import { AppError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import type { SlotInput } from '../models/slot.model';
import { SlotsState } from './slots.state';

const newSlot: SlotInput = {
  type: 'libre',
  date: '2026-11-11',
  startTime: '14:00',
  endTime: '15:00',
  recurrence: 'aucune',
};

function setup(): SlotsState {
  TestBed.configureTestingModule({
    providers: [...slotsTestProviders(), SlotsState],
  });
  return TestBed.inject(SlotsState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

function occurrence(slotId: string, date: string, startTime: string, endTime: string) {
  return {
    slotId,
    type: 'libre',
    date,
    startTime,
    endTime,
    recurrence: 'aucune',
    timeZone: 'Europe/Paris',
  };
}

describe('SlotsState', () => {
  beforeEach(() => {
    // Samedi 7 novembre 2026, midi locale : la semaine courante va du 2 au 8 novembre.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 7, 12, 0) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('charge la semaine du jour, du lundi au dimanche', async () => {
    const requests = trackSlotsList(() => HttpResponse.json({ from: '', to: '', items: [] }));

    const state = setup();

    await settle(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.searchParams.get('from')).toBe('2026-11-02');
    expect(requests[0]?.searchParams.get('to')).toBe('2026-11-08');
    expect(state.weekStart()).toBe('2026-11-02');
    expect(state.weekEnd()).toBe('2026-11-08');
  });

  it('range les créneaux dans la journée à laquelle ils appartiennent', async () => {
    trackSlotsList(() =>
      HttpResponse.json({
        from: '2026-11-02',
        to: '2026-11-08',
        items: [
          occurrence('slot-a', '2026-11-03', '09:00', '10:00'),
          occurrence('slot-b', '2026-11-03', '08:00', '09:00'),
        ],
      }),
    );

    const state = setup();

    await settle(() => expect(state.isLoading()).toBe(false));
    const tuesday = state.days().find((day) => day.date === '2026-11-03');
    expect(tuesday?.slots.map((slot) => slot.id)).toEqual(['slot-a', 'slot-b']);
    expect(state.days()).toHaveLength(7);
    expect(state.days().filter((day) => day.slots.length > 0)).toHaveLength(1);
  });

  it('passe à la semaine suivante et la recharge', async () => {
    const requests = trackSlotsList(() => HttpResponse.json({ from: '', to: '', items: [] }));
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    state.nextWeek();

    await settle(() => expect(requests).toHaveLength(2));
    expect(requests[1]?.searchParams.get('from')).toBe('2026-11-09');
    expect(state.weekStart()).toBe('2026-11-09');
  });

  it('ignore la réponse d’une semaine déjà quittée', async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let calls = 0;
    trackSlotsList(async () => {
      calls += 1;
      if (calls === 1) {
        await firstGate;
        return HttpResponse.json({
          from: '',
          to: '',
          items: [occurrence('slot-ancienne', '2026-11-03', '09:00', '10:00')],
        });
      }
      return HttpResponse.json({
        from: '',
        to: '',
        items: [occurrence('slot-nouvelle', '2026-11-10', '09:00', '10:00')],
      });
    });

    const state = setup();
    await settle(() => expect(calls).toBe(1));
    state.nextWeek();
    await settle(() => expect(state.isLoading()).toBe(false));

    releaseFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    const ids = state.days().flatMap((day) => day.slots.map((slot) => slot.id));
    expect(ids).toEqual(['slot-nouvelle']);
  });

  it('expose une erreur de chargement et vide la semaine', async () => {
    trackSlotsList(() => new HttpResponse(null, { status: 500 }));

    const state = setup();

    await settle(() => expect(state.error()).not.toBeNull());
    expect(state.error()?.status).toBe(500);
    expect(state.days().every((day) => day.slots.length === 0)).toBe(true);
  });

  it('recharge la semaine après une création réussie', async () => {
    const requests = trackSlotsList(() => HttpResponse.json({ from: '', to: '', items: [] }));
    server.use(
      http.post(SLOTS_URL, () =>
        HttpResponse.json({ id: 'slot-new', ...newSlot }, { status: 201 }),
      ),
    );
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    await state.create(newSlot);

    expect(requests).toHaveLength(2);
    expect(state.saving()).toBe(false);
  });

  it('envoie le fuseau du navigateur à la création', async () => {
    trackSlotsList(() => HttpResponse.json({ from: '', to: '', items: [] }));
    let body: { timeZone?: string } | undefined;
    server.use(
      http.post(SLOTS_URL, async ({ request }) => {
        body = (await request.json()) as { timeZone?: string };
        return HttpResponse.json({ id: 'slot-new', ...newSlot }, { status: 201 });
      }),
    );
    const state = setup();
    await settle(() => expect(state.isLoading()).toBe(false));

    await state.create(newSlot);

    expect(body?.timeZone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('rejette une création refusée par le back, avec ses erreurs par champ, sans recharger', async () => {
    const requests = trackSlotsList(() => HttpResponse.json({ from: '', to: '', items: [] }));
    server.use(
      http.post(SLOTS_URL, () =>
        slotValidationProblem([{ field: 'startTime', message: 'Heure invalide.' }]),
      ),
    );
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    const rejection = await state.create(newSlot).catch((error: unknown) => error);

    expect(rejection).toBeInstanceOf(AppError);
    expect((rejection as AppError).fieldErrors).toEqual([
      { field: 'startTime', message: 'Heure invalide.' },
    ]);
    expect((rejection as AppError).userMessage).toBe(ERROR_MESSAGES['VALIDATION_FAILED']);
    expect(requests).toHaveLength(1);
    expect(state.saving()).toBe(false);
  });

  it('supprime un créneau puis recharge la semaine', async () => {
    const requests = trackSlotsList(() =>
      HttpResponse.json({
        from: '',
        to: '',
        items: [occurrence(libreMardiApi.id, '2026-11-10', '09:00', '10:30')],
      }),
    );
    let deletedId = '';
    server.use(
      http.delete(`${SLOTS_URL}/:id`, ({ params }) => {
        deletedId = String(params['id']);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    await state.remove(occupeLundiHebdoApi.id);

    expect(deletedId).toBe(occupeLundiHebdoApi.id);
    expect(requests).toHaveLength(2);
  });
});
