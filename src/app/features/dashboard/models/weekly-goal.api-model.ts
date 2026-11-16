/** Cible hebdomadaire telle que renvoyée par `GET /api/goals/weekly/:week`. */
export interface WeeklyGoalApi {
  /** Semaine ISO `AAAA-Www`. */
  week: string;
  /** Temps cible de la semaine en secondes, null sans objectif hebdomadaire. */
  targetSeconds: number | null;
  /** Durée réalisée sur la semaine, en secondes. */
  doneSeconds: number;
  /** Huit dernières semaines, la plus ancienne en premier, semaine demandée en dernier. */
  history: { week: string; doneSeconds: number }[];
}
