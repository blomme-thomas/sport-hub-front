import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { http, HttpResponse } from 'msw';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { vi } from 'vitest';
import { API_BASE_URL } from '../app/core/config/api-base-url.token';
import { errorInterceptor } from '../app/core/http/error.interceptor';
import { server } from './server';

export const SESSIONS_API_URL = 'http://api.test/api';
export const SESSIONS_URL = `${SESSIONS_API_URL}/sessions`;

export function sessionsTestProviders() {
  return [
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
    { provide: API_BASE_URL, useValue: SESSIONS_API_URL },
    { provide: NzMessageService, useValue: { error: vi.fn(), success: vi.fn() } },
    NzModalService,
    { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
  ];
}

export function sessionProblem(status: number, code: string): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:session',
      title: 'Error',
      status,
      detail: 'Une erreur est survenue.',
      instance: '/api/sessions',
      code,
      correlationId: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
    },
    { status, headers: { 'content-type': 'application/problem+json' } },
  );
}

/** Intercepte `PUT /api/sessions/:id/modules` et renvoie le corps reçu, pour vérifier la requête. */
export function trackModulesReplace(respond?: () => Response | Promise<Response>): unknown[] {
  const bodies: unknown[] = [];
  server.use(
    http.put(`${SESSIONS_URL}/:id/modules`, async ({ request }) => {
      bodies.push(await request.json());
      return respond ? respond() : HttpResponse.json({});
    }),
  );
  return bodies;
}
