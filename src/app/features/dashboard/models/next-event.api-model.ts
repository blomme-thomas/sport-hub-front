export type NextEventGoalTypeApi = 'evenement' | 'volume' | 'regularite';

export type NextEventFormatApi = 'sprint' | 'olympique' | 'half' | 'full' | 'autre';

/** Objectif tel que renvoyé par `GET /api/goals`, limité aux champs utiles au tableau de bord. */
export interface NextEventGoalApi {
  id: string;
  title: string;
  type: NextEventGoalTypeApi;
  targetDate: string | null;
  eventFormat: NextEventFormatApi | null;
  targetTimeSeconds: number | null;
}

export interface NextEventGoalsResponseApi {
  items: NextEventGoalApi[];
}
