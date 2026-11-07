export type GoalTypeApi = 'evenement' | 'volume' | 'regularite';

export type EventFormatApi = 'sprint' | 'olympique' | 'half' | 'full' | 'autre';

/** Objectif tel que renvoyé par `GET /api/goals` et les écritures (forme JSON du back). */
export interface GoalApi {
  id: string;
  title: string;
  type: GoalTypeApi;
  targetDate: string | null;
  eventFormat: EventFormatApi | null;
  targetTimeSeconds: number | null;
}

export interface GoalListResponseApi {
  items: GoalApi[];
}

export interface CreateGoalRequestApi {
  title: string;
  type: GoalTypeApi;
  targetDate?: string | null;
  eventFormat?: EventFormatApi | null;
  targetTimeSeconds?: number | null;
}

/** Champs absents = inchangés ; `null` efface la valeur. */
export interface UpdateGoalRequestApi {
  title?: string;
  type?: GoalTypeApi;
  targetDate?: string | null;
  eventFormat?: EventFormatApi | null;
  targetTimeSeconds?: number | null;
}
