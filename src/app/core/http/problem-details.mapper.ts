import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { AppError, FieldError } from './app-error';
import { hasErrorMessage, messageForCode } from './error-messages';
import { FieldErrorApi, ProblemDetailsApi } from './problem-details.api-model';

const PROBLEM_JSON_MEDIA_TYPE = 'application/problem+json';
const CORRELATION_ID_HEADER = 'x-correlation-id';
const TIMEOUT_STATUSES: readonly number[] = [408, 504];

/**
 * Convertit toute erreur remontée par HttpClient en `AppError` typée, sans jamais lever d'exception.
 *
 * Un corps `application/problem+json` conforme donne le code de l'API, son `errors[]` et son `correlationId`.
 * Les cas hors contrat (réseau, délai dépassé, réponse non conforme) reçoivent un code interne.
 * Le `userMessage` ajoute la référence de corrélation pour les 5xx et les codes inconnus.
 */
export function toAppError(err: unknown): AppError {
  if (err instanceof TimeoutError) {
    return build({ code: 'TIMEOUT', status: 0, cause: err });
  }
  if (!(err instanceof HttpErrorResponse)) {
    return build({ code: 'UNKNOWN', status: 0, cause: err });
  }

  const headerCorrelationId = err.headers.get(CORRELATION_ID_HEADER) ?? undefined;
  const invalidResponse = (): AppError =>
    build({
      code: 'INVALID_RESPONSE',
      status: err.status,
      correlationId: headerCorrelationId,
      cause: err,
    });

  if (err.status === 0) {
    return build({ code: 'NETWORK_ERROR', status: 0, cause: err });
  }
  if (TIMEOUT_STATUSES.includes(err.status)) {
    return build({
      code: 'TIMEOUT',
      status: err.status,
      correlationId: headerCorrelationId,
      cause: err,
    });
  }
  if (!isProblemJson(err) || !isProblemDetailsBody(err.error)) {
    return invalidResponse();
  }

  const body = err.error;
  return build({
    code: body.code,
    status: err.status,
    detail: typeof body.detail === 'string' ? body.detail : undefined,
    correlationId:
      typeof body.correlationId === 'string' ? body.correlationId : headerCorrelationId,
    fieldErrors: readFieldErrors(body.errors),
    cause: err,
  });
}

interface BuildInput {
  code: string;
  status: number;
  detail?: string;
  correlationId?: string;
  fieldErrors?: FieldError[];
  cause?: unknown;
}

function build({ code, status, detail, correlationId, fieldErrors, cause }: BuildInput): AppError {
  const message = messageForCode(code);
  const isUnexpected = status >= 500 || !hasErrorMessage(code);
  const userMessage =
    isUnexpected && correlationId ? `${message} Référence : ${correlationId}` : message;

  return new AppError({ code, status, userMessage, detail, correlationId, fieldErrors, cause });
}

function isProblemJson(err: HttpErrorResponse): boolean {
  return err.headers.get('content-type')?.toLowerCase().includes(PROBLEM_JSON_MEDIA_TYPE) === true;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isProblemDetailsBody(
  value: unknown,
): value is Partial<ProblemDetailsApi> & Pick<ProblemDetailsApi, 'code'> {
  return isPlainObject(value) && typeof value['code'] === 'string';
}

function readFieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(isFieldErrorApi)
    .map(({ field, code, message }) => ({ field, code, message }));
}

function isFieldErrorApi(value: unknown): value is FieldErrorApi {
  return (
    isPlainObject(value) &&
    typeof value['field'] === 'string' &&
    (value['code'] === undefined || typeof value['code'] === 'string') &&
    typeof value['message'] === 'string'
  );
}
