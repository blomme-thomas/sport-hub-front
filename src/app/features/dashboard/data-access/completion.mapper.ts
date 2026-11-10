/** Occurrence de séance utile au calcul de complétion : date `YYYY-MM-DD` et statut (`GET /api/sessions`). */
export interface CompletionOccurrence {
  date: string;
  status: string;
}

/** Complétion des séances sur la période : séances réalisées parmi celles déjà dues. */
export interface CompletionView {
  realised: number;
  expected: number;
  /** Pourcentage entier ; `null` tant qu'aucune séance n'est due sur la période. */
  percent: number | null;
}

/**
 * Séances « dues » : toutes sauf les annulées, à une date antérieure ou égale à `today` (jour UTC).
 * Une séance due et non réalisée (planifiée dans le passé ou manquée) compte dans le total attendu.
 * Les séances futures ne comptent pas encore.
 */
export function toCompletionView(
  occurrences: readonly CompletionOccurrence[],
  today: string,
): CompletionView {
  const due = occurrences.filter((item) => item.status !== 'annulee' && item.date <= today);
  const realised = due.filter((item) => item.status === 'realisee').length;
  const expected = due.length;
  return {
    realised,
    expected,
    percent: expected === 0 ? null : Math.round((realised / expected) * 100),
  };
}
