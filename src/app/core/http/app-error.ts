/** Erreur de validation rattachée à un champ de formulaire, `field` tel que renvoyé par l'API. */
export interface FieldError {
  field: string;
  code?: string;
  message: string;
}

export interface AppErrorOptions {
  code: string;
  status: number;
  userMessage: string;
  detail?: string;
  fieldErrors?: readonly FieldError[];
  correlationId?: string;
  cause?: unknown;
}

/**
 * Erreur HTTP normalisée par `toAppError` : code stable, message utilisateur prêt à afficher et erreurs par champ.
 * `status` vaut 0 pour une erreur réseau et `code` prend une valeur interne (`NETWORK_ERROR`, `TIMEOUT`,
 * `INVALID_RESPONSE`, `UNKNOWN`) hors contrat API.
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly userMessage: string;
  readonly detail: string | undefined;
  readonly fieldErrors: readonly FieldError[];
  readonly correlationId: string | undefined;

  constructor(options: AppErrorOptions) {
    super(options.userMessage, { cause: options.cause });
    this.name = 'AppError';
    this.code = options.code;
    this.status = options.status;
    this.userMessage = options.userMessage;
    this.detail = options.detail;
    this.fieldErrors = options.fieldErrors ?? [];
    this.correlationId = options.correlationId;
  }
}
