import { http, HttpResponse } from 'msw';
import type {
  CreateSlotRequestApi,
  SlotApi,
  SlotOccurrenceApi,
  SlotOccurrencesResponseApi,
  UpdateSlotRequestApi,
} from '../../app/features/creneaux/models/slot.api-model';
import { addIsoDays } from '../../app/shared/utils/iso-date';
import { slotsFixtures } from '../fixtures/slots.fixtures';

let slots: SlotApi[] = structuredClone(slotsFixtures);

function slotNotFound(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:slot-not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Créneau introuvable.',
      instance: '/api/slots',
      code: 'SLOT_NOT_FOUND',
      correlationId: '5b1e7c2a-4f0d-4e8a-9c3b-2d6f1a7e8b90',
    },
    { status: 404, headers: { 'content-type': 'application/problem+json' } },
  );
}

/** Occurrences d'une période, comme le back : série hebdomadaire ancrée à `date`, bornes incluses. */
function occurrencesBetween(from: string, to: string): SlotOccurrenceApi[] {
  const items: SlotOccurrenceApi[] = [];
  for (const slot of slots) {
    const days: string[] = [];
    if (slot.recurrence === 'aucune') {
      if (slot.date >= from && slot.date <= to) {
        days.push(slot.date);
      }
    } else {
      let day = slot.date;
      while (day < from) {
        day = addIsoDays(day, 7);
      }
      for (; day <= to; day = addIsoDays(day, 7)) {
        days.push(day);
      }
    }
    for (const day of days) {
      items.push({
        slotId: slot.id,
        type: slot.type,
        date: day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        recurrence: slot.recurrence,
        timeZone: slot.timeZone,
      });
    }
  }
  return items.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.slotId.localeCompare(b.slotId),
  );
}

export const slotsHandlers = [
  http.get('*/api/slots', ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';
    const body: SlotOccurrencesResponseApi = { from, to, items: occurrencesBetween(from, to) };
    return HttpResponse.json(body);
  }),
  http.post('*/api/slots', async ({ request }) => {
    const body = (await request.json()) as CreateSlotRequestApi;
    const created: SlotApi = {
      id: crypto.randomUUID(),
      type: body.type,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      recurrence: body.recurrence,
      timeZone: body.timeZone,
    };
    slots = [...slots, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch('*/api/slots/:id', async ({ params, request }) => {
    const id = String(params['id']);
    const current = slots.find((slot) => slot.id === id);
    if (current === undefined) {
      return slotNotFound();
    }
    const body = (await request.json()) as UpdateSlotRequestApi;
    const updated: SlotApi = { ...current, ...body };
    slots = slots.map((slot) => (slot.id === id ? updated : slot));
    return HttpResponse.json(updated);
  }),
  http.delete('*/api/slots/:id', ({ params }) => {
    const id = String(params['id']);
    if (!slots.some((slot) => slot.id === id)) {
      return slotNotFound();
    }
    slots = slots.filter((slot) => slot.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
