/** Vue de la carte « Objectif de la semaine ». */
export interface WeeklyGoalView {
  /** Libellé de la semaine, par exemple « 6h 42 ». */
  doneLabel: string;
  /** Libellé de la cible, par exemple « 8h 00 », ou null sans objectif. */
  targetLabel: string | null;
  /** Pourcentage de la cible atteint, arrondi ; null sans objectif. Peut dépasser 100. */
  percent: number | null;
  /** Message de statut dérivé du pourcentage ; null sans objectif. */
  statusMessage: string | null;
  /** Points de la mini-courbe : libellé de semaine et durée réalisée en heures. */
  trend: { label: string; hours: number }[];
}
