import { HttpErrorResponse, provideHttpClient, withFetch } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { occupeLundiHebdoApi, libreMardiApi } from '../../../../mocks/fixtures/slots.fixtures';
import {
  SLOTS_API_URL,
  SLOTS_URL,
  slotProblem,
  trackSlotsList,
} from '../../../../mocks/slots.testing';
import { server } from '../../../../mocks/server';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { CreateSlotRequestApi, UpdateSlotRequestApi } from '../models/slot.api-model';
import { SlotsApi } from './slots.api';

function setup(): SlotsApi {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch()),
      { provide: API_BASE_URL, useValue: SLOTS_API_URL },
      SlotsApi,
    ],
  });
  return TestBed.inject(SlotsApi);
}

const createBody: CreateSlotRequestApi = {
  type: 'libre',
  date: '2026-11-10',
  startTime: '09:00',
  endTime: '10:30',
  recurrence: 'aucune',
  timeZone: 'Europe/Paris',
};

describe('SlotsApi', () => {
  it('interroge GET /api/slots avec la période en from et to', async () => {
    const requests = trackSlotsList(() =>
      HttpResponse.json({ from: '2026-11-09', to: '2026-11-15', items: [] }),
    );

    await firstValueFrom(setup().list('2026-11-09', '2026-11-15'));

    expect(requests).toHaveLength(1);
    expect(requests[0]?.pathname).toBe('/api/slots');
    expect(requests[0]?.searchParams.get('from')).toBe('2026-11-09');
    expect(requests[0]?.searchParams.get('to')).toBe('2026-11-15');
  });

  it('mappe chaque occurrence avec l’identifiant du créneau', async () => {
    trackSlotsList(() =>
      HttpResponse.json({
        from: '2026-11-09',
        to: '2026-11-15',
        items: [
          {
            slotId: libreMardiApi.id,
            type: 'libre',
            date: '2026-11-10',
            startTime: '09:00',
            endTime: '10:30',
            recurrence: 'aucune',
            timeZone: 'Europe/Paris',
          },
          {
            slotId: occupeLundiHebdoApi.id,
            type: 'occupe',
            date: '2026-11-09',
            startTime: '18:00',
            endTime: '19:00',
            recurrence: 'hebdomadaire',
            timeZone: 'Europe/Paris',
          },
        ],
      }),
    );

    const slots = await firstValueFrom(setup().list('2026-11-09', '2026-11-15'));

    expect(slots).toEqual([
      {
        id: 'slot-libre-mardi',
        type: 'libre',
        date: '2026-11-10',
        startTime: '09:00',
        endTime: '10:30',
        recurrence: 'aucune',
      },
      {
        id: 'slot-occupe-lundi',
        type: 'occupe',
        date: '2026-11-09',
        startTime: '18:00',
        endTime: '19:00',
        recurrence: 'hebdomadaire',
      },
    ]);
  });

  it('envoie le corps de création et mappe la réponse', async () => {
    let body: unknown;
    server.use(
      http.post(SLOTS_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { id: 'slot-new', ...createBody, timeZone: 'Europe/Paris' },
          { status: 201 },
        );
      }),
    );

    const created = await firstValueFrom(setup().create(createBody));

    expect(body).toEqual(createBody);
    expect(created).toEqual({
      id: 'slot-new',
      type: 'libre',
      date: '2026-11-10',
      startTime: '09:00',
      endTime: '10:30',
      recurrence: 'aucune',
    });
  });

  it('modifie un créneau par PATCH sur son identifiant', async () => {
    let path = '';
    let body: UpdateSlotRequestApi | undefined;
    server.use(
      http.patch(`${SLOTS_URL}/:id`, async ({ params, request }) => {
        path = String(params['id']);
        body = (await request.json()) as UpdateSlotRequestApi;
        return HttpResponse.json({
          id: path,
          type: 'occupe',
          date: '2026-11-10',
          startTime: '09:00',
          endTime: '10:30',
          recurrence: 'aucune',
          timeZone: 'Europe/Paris',
        });
      }),
    );

    const updated = await firstValueFrom(
      setup().update('slot-libre-mardi', {
        type: 'occupe',
        date: '2026-11-10',
        startTime: '09:00',
        endTime: '10:30',
        recurrence: 'aucune',
      }),
    );

    expect(path).toBe('slot-libre-mardi');
    expect(body).toEqual({
      type: 'occupe',
      date: '2026-11-10',
      startTime: '09:00',
      endTime: '10:30',
      recurrence: 'aucune',
    });
    expect(updated.type).toBe('occupe');
  });

  it('supprime un créneau par DELETE sur son identifiant', async () => {
    let path = '';
    server.use(
      http.delete(`${SLOTS_URL}/:id`, ({ params }) => {
        path = String(params['id']);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(firstValueFrom(setup().delete('slot-libre-mardi'))).resolves.toBeNull();
    expect(path).toBe('slot-libre-mardi');
  });

  it('laisse remonter l’erreur HTTP telle quelle, pour que l’état la normalise', async () => {
    trackSlotsList(() => slotProblem(500, 'INTERNAL_ERROR'));

    await expect(firstValueFrom(setup().list('2026-11-09', '2026-11-15'))).rejects.toBeInstanceOf(
      HttpErrorResponse,
    );
  });
});
