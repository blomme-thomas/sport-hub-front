/**
 * Entrée `errors[]` d'une erreur de validation (`VALIDATION_FAILED`), `field` en chemin pointé avec index (`items[0].name`).
 */
export interface FieldErrorApi {
  field: string;
  code?: string;
  message: string;
}

/**
 * Corps d'erreur RFC 9457 renvoyé par l'API avec `Content-Type: application/problem+json`.
 * Écrit à la main d'après le contrat du back (`docs/technique/erreurs-api.md`) : à régénérer si le schéma OpenAPI change.
 */
export interface ProblemDetailsApi {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  correlationId: string;
  errors?: FieldErrorApi[];
  checks?: Readonly<Record<string, 'up' | 'down'>>;
}
