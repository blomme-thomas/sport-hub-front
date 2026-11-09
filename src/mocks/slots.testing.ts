import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { http, HttpResponse } from 'msw';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { vi } from 'vitest';
import { API_BASE_URL } from '../app/core/config/api-base-url.token';
import { errorInterceptor } from '../app/core/http/error.interceptor';
import type { FieldErrorApi } from '../app/core/http/problem-details.api-model';
import { slotsFixtures } from './fixtures/slots.fixtures';
import { server } from './server';

export const SLOTS_API_URL = 'http://api.test/api';
export const SLOTS_URL = `${SLOTS_API_URL}/slots`;

const CORRELATION_ID = '5b1e7c2a-4f0d-4e8a-9c3b-2d6f1a7e8b90';

export function slotsTestProviders() {
  return [
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
    { provide: API_BASE_URL, useValue: SLOTS_API_URL },
    { provide: NzMessageService, useValue: { error: vi.fn(), success: vi.fn() } },
    NzModalService,
    { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
  ];
}

export function slotProblem(status: number, code: string, errors?: FieldErrorApi[]): Response {
  return new HttpResponse(
    JSON.stringify({
      type: 'urn:sport-hub:problem:slot',
      title: 'Error',
      status,
      detail: 'Une erreur est survenue.',
      instance: '/api/slots',
      code,
      correlationId: CORRELATION_ID,
      ...(errors === undefined ? {} : { errors }),
    }),
    { status, headers: { 'content-type': 'application/problem+json' } },
  );
}

export function slotValidationProblem(errors: FieldErrorApi[]): Response {
  return slotProblem(400, 'VALIDATION_FAILED', errors);
}

/** Intercepte `GET /api/slots` et enregistre les périodes demandées ; par défaut, renvoie les fixtures. */
export function trackSlotsList(respond?: () => Response | Promise<Response>): URL[] {
  const requests: URL[] = [];
  server.use(
    http.get(SLOTS_URL, ({ request }) => {
      requests.push(new URL(request.url));
      return respond
        ? respond()
        : HttpResponse.json({ from: '', to: '', items: fixtureOccurrences() });
    }),
  );
  return requests;
}

/** Occurrences des fixtures ponctuelles, pour les tests qui n'ont pas besoin du calcul de récurrence. */
function fixtureOccurrences() {
  return slotsFixtures
    .filter((slot) => slot.recurrence === 'aucune')
    .map((slot) => ({
      slotId: slot.id,
      type: slot.type,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      recurrence: slot.recurrence,
      timeZone: slot.timeZone,
    }));
}
