/** Message affiché pour un code inconnu ou non mappé. */
export const DEFAULT_ERROR_MESSAGE = 'Une erreur inattendue est survenue. Réessayez plus tard.';

/** Message utilisateur par code (contrat API puis codes internes). Ajout : voir `docs/technique/integration-api.md`. */
export const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  VALIDATION_FAILED: 'Certaines informations saisies sont invalides.',
  BAD_REQUEST: 'La requête est invalide.',
  MALFORMED_REQUEST_BODY: 'Les données envoyées sont mal formées.',
  NOT_FOUND: 'Élément introuvable.',
  PAYLOAD_TOO_LARGE: 'Les données envoyées sont trop volumineuses.',
  CLIENT_ERROR: 'La requête a été refusée par le serveur.',
  SERVICE_UNAVAILABLE: 'Le service est momentanément indisponible. Réessayez plus tard.',
  INTERNAL_ERROR: 'Une erreur interne est survenue. Réessayez plus tard.',
  GARMIN_ACCESS_DENIED: "L'accès à Garmin a été refusé. Vérifiez la clé de l'API Garmin Personal.",
  GARMIN_UNAVAILABLE: 'Garmin est momentanément indisponible. Réessayez plus tard.',
  STATS_RANGE_TOO_LARGE: 'La plage demandée est trop étendue. Réduisez la plage de dates.',
  STATS_RANGE_INVALID: 'La date de fin doit être postérieure ou égale à la date de début.',
  WORKOUT_GENERATION_UNAVAILABLE:
    'La génération de séance est momentanément indisponible. Réessayez plus tard.',
  WORKOUT_GENERATION_ACCESS_DENIED:
    "La génération de séance n'est pas autorisée par le service d'IA.",
  WORKOUT_GENERATION_INVALID_OUTPUT: 'La séance générée ne respecte pas le format attendu.',
  GOAL_INVALID: "L'objectif n'est pas valide. Vérifiez les informations saisies.",
  GOAL_NOT_FOUND: 'Objectif introuvable. Il a peut-être déjà été supprimé.',
  GOAL_TARGET_TIME_INVALID: 'Le temps cible doit être un nombre de secondes strictement positif.',
  SLOT_INVALID: 'Le créneau n’est pas valide. Vérifiez les informations saisies.',
  SLOT_END_NOT_AFTER_START: 'L’heure de fin doit être postérieure à l’heure de début.',
  SLOT_PERIOD_INVALID: 'La période demandée n’est pas valide.',
  SLOT_PERIOD_TOO_LARGE: 'La période demandée est trop étendue.',
  SLOT_NOT_FOUND: 'Créneau introuvable. Il a peut-être déjà été supprimé.',
  NETWORK_ERROR: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
  TIMEOUT: 'Le serveur met trop de temps à répondre. Réessayez dans quelques instants.',
  INVALID_RESPONSE: 'Le serveur a renvoyé une réponse inattendue. Réessayez plus tard.',
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
