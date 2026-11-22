import type { GoalApi, GoalListResponseApi } from '../../app/features/goals/models/goal.api-model';

export const TODAY_ISO = '2026-11-07';

export const triathlonApi: GoalApi = {
  id: 'goal-triathlon',
  title: 'Triathlon de Paris',
  type: 'evenement',
  targetDate: '2026-12-06',
  eventFormat: 'olympique',
  targetTimeSeconds: 9000,
};

export const todayApi: GoalApi = {
  id: 'goal-today',
  title: 'Course du jour',
  type: 'evenement',
  targetDate: TODAY_ISO,
  eventFormat: 'sprint',
  targetTimeSeconds: 1200,
};

export const semiPastApi: GoalApi = {
  id: 'goal-semi',
  title: 'Semi-marathon de Lyon',
  type: 'evenement',
  targetDate: '2026-10-01',
  eventFormat: 'half',
  targetTimeSeconds: 5400,
};

export const volumeUndatedApi: GoalApi = {
  id: 'goal-volume',
  title: 'Volume hebdomadaire',
  type: 'volume',
  targetDate: null,
  eventFormat: null,
  targetTimeSeconds: null,
};

export const goalsListResponse: GoalListResponseApi = {
  items: [triathlonApi, todayApi, semiPastApi, volumeUndatedApi],
};
