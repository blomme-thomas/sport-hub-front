import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { http, HttpResponse } from 'msw';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { vi } from 'vitest';
import { API_BASE_URL } from '../app/core/config/api-base-url.token';
import { errorInterceptor } from '../app/core/http/error.interceptor';
import { normalStatsResponse } from './fixtures/training-stats.fixtures';
import { server } from './server';

export const API_URL = 'http://api.test/api';
export const STATS_URL = `${API_URL}/stats`;

const CORRELATION_ID = '3f0c2a52-9d3e-4a52-8f43-1d2b5a0c9e11';

export function statsTestProviders() {
  return [
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
    { provide: API_BASE_URL, useValue: API_URL },
    { provide: NzMessageService, useValue: { error: vi.fn() } },
    NzModalService,
    { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
  ];
}

export function problemResponse(status: number, code: string): Response {
  return new HttpResponse(
    JSON.stringify({
      type: 'urn:sport-hub:problem:internal-error',
      title: 'Error',
      status,
      detail: 'Une erreur interne est survenue.',
      instance: '/api/stats',
      code,
      correlationId: CORRELATION_ID,
    }),
    { status, headers: { 'content-type': 'application/problem+json' } },
  );
}

export function trackStats(
  respond: () => Response | Promise<Response> = () => HttpResponse.json(normalStatsResponse),
): URL[] {
  const requests: URL[] = [];
  server.use(
    http.get(STATS_URL, ({ request }) => {
      requests.push(new URL(request.url));
      return respond();
    }),
  );
  return requests;
}
