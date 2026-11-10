/** Nombre de zones cardiaques (Z1 à Z5) de la répartition cible et des écarts. */
export const HR_ZONE_COUNT = 5;

/** Libellés et couleurs des zones, dans l'ordre Z1 à Z5 (couleurs de la maquette). */
export const HR_ZONES: readonly { label: string; colorVariable: string }[] = [
  { label: 'Z1', colorVariable: '--sh-text-muted' },
  { label: 'Z2', colorVariable: '--sh-success' },
  { label: 'Z3', colorVariable: '--sh-orange' },
  { label: 'Z4', colorVariable: '--sh-danger' },
  { label: 'Z5', colorVariable: '--sh-violet' },
];

/** Total exact attendu de la répartition cible par zone, en pourcentage. */
export const ZONE_TOTAL_PERCENT = 100;

/** Taux de réalisation affiché au maximum (un dépassement reste visible dans l'écart, pas dans le taux). */
export const MAX_DISPLAYED_RATE = 100;

export type ObjectiveErrorKey = 'distance' | 'zones' | 'zonesTotal';

export interface ObjectiveDraft {
  /** Distance cible en mètres ; `null` si non renseignée. */
  distanceMeters: number | null;
  /** Répartition cible Z1 à Z5 en pourcentage entier ; doit totaliser 100. */
  zonePercentages: readonly (number | null)[];
}

/**
 * Valide les objectifs d'une séance. La durée cible est la durée de la séance (toujours présente), donc une
 * distance ou une durée suffit : la distance, si elle est saisie, doit être positive. La répartition par zone
 * est obligatoire et doit totaliser exactement 100 %.
 * Renvoie les erreurs par champ ; un objet vide signifie que les objectifs sont valides.
 */
export function validateObjectives(
  draft: ObjectiveDraft,
): Partial<Record<ObjectiveErrorKey, string>> {
  const errors: Partial<Record<ObjectiveErrorKey, string>> = {};

  if (draft.distanceMeters !== null && !(draft.distanceMeters > 0)) {
    errors.distance = 'La distance cible doit être supérieure à 0.';
  }

  if (
    draft.zonePercentages.length !== HR_ZONE_COUNT ||
    draft.zonePercentages.some((value) => value === null)
  ) {
    errors.zones = 'Renseigne le pourcentage des cinq zones.';
  } else {
    const total = draft.zonePercentages.reduce<number>((sum, value) => sum + (value ?? 0), 0);
    if (total !== ZONE_TOTAL_PERCENT) {
      errors.zonesTotal = `La répartition doit totaliser ${ZONE_TOTAL_PERCENT} % (actuellement ${total} %).`;
    }
  }

  return errors;
}

/** Taux plafonné à 100 % pour l'affichage ; `null` sans donnée. */
export function displayedRate(rate: number | null): number | null {
  return rate === null ? null : Math.min(rate, MAX_DISPLAYED_RATE);
}

/** Écart signé d'une zone en points de pourcentage : « +5 pts », « −5 pts », « 0 pt ». */
export function formatZoneGap(points: number): string {
  if (points === 0) {
    return '0 pt';
  }
  const sign = points > 0 ? '+' : '−';
  const absolute = Math.abs(points);
  return `${sign}${absolute} ${absolute === 1 ? 'pt' : 'pts'}`;
}
