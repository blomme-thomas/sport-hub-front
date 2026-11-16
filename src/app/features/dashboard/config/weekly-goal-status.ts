/**
 * Seuils du statut de l'objectif de la semaine, en pourcentage de la cible atteinte. Constantes testées :
 * la règle d'affichage vit ici, pas dans le back (qui renvoie les secondes brutes).
 */
export const WEEKLY_GOAL_THRESHOLDS = {
  /** Cible atteinte ou dépassée. */
  reached: 100,
  /** « Très bien ! » à partir de ce pourcentage. */
  veryGood: 75,
  /** « En bonne voie » à partir de ce pourcentage. */
  onTrack: 50,
} as const;

export const WEEKLY_GOAL_MESSAGES = {
  reached: 'Objectif atteint !',
  veryGood: 'Très bien !',
  onTrack: 'En bonne voie',
  toStrengthen: 'À renforcer',
} as const;

/** Message de statut d'un pourcentage de cible atteinte (avec la cible connue). */
export function weeklyGoalStatusOf(percent: number): string {
  if (percent >= WEEKLY_GOAL_THRESHOLDS.reached) {
    return WEEKLY_GOAL_MESSAGES.reached;
  }
  if (percent >= WEEKLY_GOAL_THRESHOLDS.veryGood) {
    return WEEKLY_GOAL_MESSAGES.veryGood;
  }
  if (percent >= WEEKLY_GOAL_THRESHOLDS.onTrack) {
    return WEEKLY_GOAL_MESSAGES.onTrack;
  }
  return WEEKLY_GOAL_MESSAGES.toStrengthen;
}
