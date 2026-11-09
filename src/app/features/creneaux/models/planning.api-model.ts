/** Corps de `POST /api/planning/generate`. `to` est obligatoire sans objectif ; `goalId` remplace `to`. */
export interface GeneratePlanningRequestApi {
  from: string;
  to?: string;
  goalId?: string;
}

/** Séance créée par la génération, telle que renvoyée par le back. */
export interface ScheduledSessionApi {
  id: string;
  date: string;
  disciplineTypeKey: string;
  durationMinutes: number;
}

/** Réponse de `POST /api/planning/generate`. */
export interface GeneratedPlanningApi {
  from: string;
  to: string;
  items: ScheduledSessionApi[];
}

/** Sous-ensemble d'un objectif utile au calendrier : un événement avec sa date cible. */
export interface GoalApi {
  id: string;
  title: string;
  type: 'evenement' | 'volume' | 'regularite';
  targetDate: string | null;
}

export interface GoalListResponseApi {
  items: GoalApi[];
}
