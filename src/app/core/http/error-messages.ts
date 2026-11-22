import { TEXTS } from '@shared/texts/texts';

/** Message affiché pour un code inconnu ou non mappé. */
export const DEFAULT_ERROR_MESSAGE = TEXTS.errors.default;

/** Message utilisateur par code (contrat API puis codes internes). Ajout : voir `docs/technique/integration-api.md`. */
export const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  ...TEXTS.errors.messages,
  UNKNOWN: DEFAULT_ERROR_MESSAGE,
};

/** Indique si le code a un message dédié (contrat API ou interne). */
export function hasErrorMessage(code: string): boolean {
  return Object.hasOwn(ERROR_MESSAGES, code);
}

/** Renvoie le message utilisateur d'un code, ou `DEFAULT_ERROR_MESSAGE` si le code est inconnu. */
export function messageForCode(code: string): string {
  return hasErrorMessage(code) ? ERROR_MESSAGES[code] : DEFAULT_ERROR_MESSAGE;
}
