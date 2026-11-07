import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NzMessageService } from 'ng-zorro-antd/message';
import { http, HttpResponse } from 'msw';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../mocks/server';
import { AppError } from './app-error';
import { errorInterceptor } from './error.interceptor';
import { DEFAULT_ERROR_MESSAGE, ERROR_MESSAGES } from './error-messages';

const URL = 'http://api.test/api/workouts';
const CORRELATION_ID = '3f0c2a52-9d3e-4a52-8f43-1d2b5a0c9e11';

const messages = { error: vi.fn() };

function setup(): HttpClient {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
      { provide: NzMessageService, useValue: messages },
    ],
  });
  return TestBed.inject(HttpClient);
}

function problem(status: number, body: Record<string, unknown>): HttpResponse<string> {
  return new HttpResponse(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

describe('errorInterceptor', () => {
  beforeEach(() => {
    messages.error.mockClear();
  });

  it('notifie le message du code connu et relance une AppError', async () => {
    server.use(
      http.get(URL, () =>
        problem(503, {
          status: 503,
          code: 'GARMIN_UNAVAILABLE',
          correlationId: CORRELATION_ID,
          detail: 'Garmin est momentanément indisponible. Réessayez plus tard.',
        }),
      ),
    );

    await expect(firstValueFrom(setup().get(URL))).rejects.toBeInstanceOf(AppError);
    expect(messages.error).toHaveBeenCalledWith(
      `${ERROR_MESSAGES['GARMIN_UNAVAILABLE']} Référence : ${CORRELATION_ID}`,
    );
  });

  it('notifie le message par défaut pour un code inconnu', async () => {
    server.use(
      http.get(URL, () =>
        problem(500, { status: 500, code: 'CODE_INCONNU', correlationId: CORRELATION_ID }),
      ),
    );

    await expect(firstValueFrom(setup().get(URL))).rejects.toMatchObject({ code: 'CODE_INCONNU' });
    expect(messages.error).toHaveBeenCalledWith(
      `${DEFAULT_ERROR_MESSAGE} Référence : ${CORRELATION_ID}`,
    );
  });

  it('notifie le message de validation et expose ses erreurs par champ', async () => {
    server.use(
      http.get(URL, () =>
        problem(400, {
          status: 400,
          code: 'VALIDATION_FAILED',
          correlationId: CORRELATION_ID,
          errors: [
            { field: 'items[0].name', code: 'IS_NOT_EMPTY', message: 'name should not be empty' },
          ],
        }),
      ),
    );

    await expect(firstValueFrom(setup().get(URL))).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      fieldErrors: [
        { field: 'items[0].name', code: 'IS_NOT_EMPTY', message: 'name should not be empty' },
      ],
    });
    expect(messages.error).toHaveBeenCalledWith(ERROR_MESSAGES['VALIDATION_FAILED']);
  });

  it('notifie une erreur générique pour une erreur réseau', async () => {
    server.use(http.get(URL, () => HttpResponse.error()));

    await expect(firstValueFrom(setup().get(URL))).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
    expect(messages.error).toHaveBeenCalledWith(ERROR_MESSAGES['NETWORK_ERROR']);
  });

  it('notifie un message de délai dépassé pour un 504', async () => {
    server.use(
      http.get(URL, () => new HttpResponse('<html>Gateway Timeout</html>', { status: 504 })),
    );

    await expect(firstValueFrom(setup().get(URL))).rejects.toMatchObject({
      code: 'TIMEOUT',
      status: 504,
    });
    expect(messages.error).toHaveBeenCalledWith(ERROR_MESSAGES['TIMEOUT']);
  });

  it('notifie une erreur générique pour une réponse non JSON, comme un HTML de proxy', async () => {
    server.use(
      http.get(
        URL,
        () => new HttpResponse('<html><body>Bad Gateway</body></html>', { status: 502 }),
      ),
    );

    await expect(firstValueFrom(setup().get(URL))).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
    expect(messages.error).toHaveBeenCalledWith(ERROR_MESSAGES['INVALID_RESPONSE']);
  });
});
