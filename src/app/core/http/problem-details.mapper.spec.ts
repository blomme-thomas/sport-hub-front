import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AppError } from './app-error';
import { DEFAULT_ERROR_MESSAGE, ERROR_MESSAGES } from './error-messages';
import { toAppError } from './problem-details.mapper';

const PROBLEM_HEADERS = { 'content-type': 'application/problem+json' };
const CORRELATION_ID = '3f0c2a52-9d3e-4a52-8f43-1d2b5a0c9e11';

function problemError(
  status: number,
  body: unknown,
  headers: Record<string, string> = PROBLEM_HEADERS,
) {
  return new HttpErrorResponse({
    status,
    error: body,
    headers: new HttpHeaders(headers),
    url: 'http://api.test/api/workouts',
  });
}

function problemBody(overrides: Record<string, unknown> = {}) {
  return {
    type: 'urn:sport-hub:problem:internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'Une erreur interne est survenue.',
    instance: '/api/workouts',
    code: 'INTERNAL_ERROR',
    correlationId: CORRELATION_ID,
    ...overrides,
  };
}

describe('toAppError', () => {
  it('convertit une réponse problem+json conforme en AppError typée', () => {
    const err = problemError(400, {
      type: 'urn:sport-hub:problem:validation-failed',
      title: 'Bad Request',
      status: 400,
      detail: 'La requête contient 2 erreur(s) de validation.',
      instance: '/api/workouts',
      code: 'VALIDATION_FAILED',
      correlationId: CORRELATION_ID,
      errors: [
        { field: 'name', code: 'IS_NOT_EMPTY', message: 'name should not be empty' },
        {
          field: 'address.city',
          code: 'PROPERTY_NOT_ALLOWED',
          message: 'property city should not exist',
        },
      ],
    });

    const appError = toAppError(err);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.code).toBe('VALIDATION_FAILED');
    expect(appError.status).toBe(400);
    expect(appError.detail).toBe('La requête contient 2 erreur(s) de validation.');
    expect(appError.correlationId).toBe(CORRELATION_ID);
    expect(appError.fieldErrors).toEqual([
      { field: 'name', code: 'IS_NOT_EMPTY', message: 'name should not be empty' },
      {
        field: 'address.city',
        code: 'PROPERTY_NOT_ALLOWED',
        message: 'property city should not exist',
      },
    ]);
    expect(appError.userMessage).toBe(ERROR_MESSAGES['VALIDATION_FAILED']);
  });

  it('affiche le message associé à un code connu sans référence pour une erreur 4xx', () => {
    const appError = toAppError(
      problemError(404, {
        code: 'NOT_FOUND',
        status: 404,
        detail: 'Cannot GET /api/inconnu',
        correlationId: CORRELATION_ID,
      }),
    );

    expect(appError.userMessage).toBe(ERROR_MESSAGES['NOT_FOUND']);
    expect(appError.userMessage).not.toContain(CORRELATION_ID);
  });

  it('affiche le message par défaut pour un code inconnu sans exposer le code', () => {
    const appError = toAppError(
      problemError(409, {
        code: 'WORKOUT_ALREADY_PLANNED',
        status: 409,
        detail: 'Séance déjà planifiée.',
        correlationId: CORRELATION_ID,
      }),
    );

    expect(appError.code).toBe('WORKOUT_ALREADY_PLANNED');
    expect(appError.userMessage).toBe(`${DEFAULT_ERROR_MESSAGE} Référence : ${CORRELATION_ID}`);
  });

  it('affiche le message par défaut pour un code de prototype sans lever d erreur', () => {
    const appError = toAppError(problemError(400, { code: 'constructor', status: 400 }));

    expect(appError.userMessage).toBe(DEFAULT_ERROR_MESSAGE);
  });

  it('ajoute la référence de corrélation à un message 5xx', () => {
    const appError = toAppError(
      problemError(503, problemBody({ status: 503, code: 'GARMIN_UNAVAILABLE' })),
    );

    expect(appError.userMessage).toBe(
      `${ERROR_MESSAGES['GARMIN_UNAVAILABLE']} Référence : ${CORRELATION_ID}`,
    );
  });

  it('prend le correlationId de l en-tête X-Correlation-Id quand le corps ne le porte pas', () => {
    const appError = toAppError(
      problemError(
        500,
        { code: 'INTERNAL_ERROR', status: 500 },
        { 'content-type': 'application/problem+json', 'x-correlation-id': 'abc-123' },
      ),
    );

    expect(appError.correlationId).toBe('abc-123');
    expect(appError.userMessage).toBe(`${ERROR_MESSAGES['INTERNAL_ERROR']} Référence : abc-123`);
  });

  it('privilégie le correlationId du corps à celui de l en-tête X-Correlation-Id', () => {
    const appError = toAppError(
      problemError(
        500,
        { code: 'INTERNAL_ERROR', status: 500, correlationId: CORRELATION_ID },
        { 'content-type': 'application/problem+json', 'x-correlation-id': 'header-id' },
      ),
    );

    expect(appError.correlationId).toBe(CORRELATION_ID);
    expect(appError.userMessage).toBe(
      `${ERROR_MESSAGES['INTERNAL_ERROR']} Référence : ${CORRELATION_ID}`,
    );
  });

  it('conserve une entrée de errors[] sans code', () => {
    const appError = toAppError(
      problemError(400, {
        code: 'VALIDATION_FAILED',
        status: 400,
        errors: [{ field: 'address.city', message: 'requis' }],
      }),
    );

    expect(appError.fieldErrors).toEqual([{ field: 'address.city', message: 'requis' }]);
  });

  it('ignore les entrées de errors[] qui ne respectent pas la forme attendue', () => {
    const appError = toAppError(
      problemError(400, {
        code: 'VALIDATION_FAILED',
        status: 400,
        errors: [
          { field: 'name', code: 'IS_NOT_EMPTY', message: 'requis' },
          { field: 'name' },
          'texte',
        ],
      }),
    );

    expect(appError.fieldErrors).toEqual([
      { field: 'name', code: 'IS_NOT_EMPTY', message: 'requis' },
    ]);
  });

  it('renvoie une erreur réseau pour un statut 0', () => {
    const appError = toAppError(
      new HttpErrorResponse({
        status: 0,
        statusText: 'Unknown Error',
        error: new ProgressEvent('error'),
      }),
    );

    expect(appError.code).toBe('NETWORK_ERROR');
    expect(appError.status).toBe(0);
    expect(appError.userMessage).toBe(ERROR_MESSAGES['NETWORK_ERROR']);
  });

  it('renvoie un timeout pour une TimeoutError RxJS', () => {
    const appError = toAppError(new TimeoutError());

    expect(appError.code).toBe('TIMEOUT');
    expect(appError.userMessage).toBe(ERROR_MESSAGES['TIMEOUT']);
  });

  it('renvoie un timeout pour un statut 504 ou 408', () => {
    const gateway = toAppError(
      problemError(504, '<html>Gateway Timeout</html>', { 'content-type': 'text/html' }),
    );
    const requestTimeout = toAppError(new HttpErrorResponse({ status: 408, error: null }));

    expect(gateway.code).toBe('TIMEOUT');
    expect(requestTimeout.code).toBe('TIMEOUT');
  });

  it('renvoie une réponse non conforme pour un HTML de proxy, sans lever d exception', () => {
    const appError = toAppError(
      problemError(502, '<html><body>Bad Gateway</body></html>', {
        'content-type': 'text/html',
        'x-correlation-id': 'proxy-42',
      }),
    );

    expect(appError.code).toBe('INVALID_RESPONSE');
    expect(appError.status).toBe(502);
    expect(appError.userMessage).toBe(`${ERROR_MESSAGES['INVALID_RESPONSE']} Référence : proxy-42`);
  });

  it('renvoie une réponse non conforme pour un corps problem+json sans code', () => {
    const appError = toAppError(problemError(500, { status: 500, detail: 'Oups' }));

    expect(appError.code).toBe('INVALID_RESPONSE');
    expect(appError.userMessage).toBe(ERROR_MESSAGES['INVALID_RESPONSE']);
  });

  it('renvoie une réponse non conforme pour un corps JSON non objet', () => {
    const appError = toAppError(problemError(400, ['erreur']));

    expect(appError.code).toBe('INVALID_RESPONSE');
  });

  it('renvoie une réponse non conforme pour un corps Blob ou texte sur problem+json, sans lever d exception', () => {
    const blob = toAppError(
      problemError(500, new Blob(['{"code":"INTERNAL_ERROR"}']), PROBLEM_HEADERS),
    );
    const text = toAppError(problemError(500, '{"code":"INTERNAL_ERROR"}', PROBLEM_HEADERS));

    expect(blob.code).toBe('INVALID_RESPONSE');
    expect(text.code).toBe('INVALID_RESPONSE');
  });

  it('renvoie une réponse non conforme pour un corps avec code en application/json', () => {
    const appError = toAppError(
      problemError(
        400,
        { code: 'VALIDATION_FAILED', status: 400 },
        { 'content-type': 'application/json' },
      ),
    );

    expect(appError.code).toBe('INVALID_RESPONSE');
    expect(appError.userMessage).toBe(ERROR_MESSAGES['INVALID_RESPONSE']);
  });

  it('renvoie une réponse non conforme pour un corps vide sans content-type problem+json', () => {
    const appError = toAppError(new HttpErrorResponse({ status: 500, error: null }));

    expect(appError.code).toBe('INVALID_RESPONSE');
    expect(appError.fieldErrors).toEqual([]);
  });

  it('renvoie UNKNOWN pour une erreur qui n est ni HTTP ni un timeout', () => {
    const appError = toAppError(new Error('boom'));

    expect(appError.code).toBe('UNKNOWN');
    expect(appError.userMessage).toBe(DEFAULT_ERROR_MESSAGE);
  });
});
