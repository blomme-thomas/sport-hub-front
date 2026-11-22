import type { WeeklyGoalApi } from '../../app/features/dashboard/models/weekly-goal.api-model';

/** Objectif de 8 h, 6 h 42 réalisées (84 %), historique de huit semaines. */
export const weeklyGoalApi: WeeklyGoalApi = {
  week: '2026-W47',
  targetSeconds: 28800,
  doneSeconds: 24120,
  history: [
    { week: '2026-W40', doneSeconds: 18000 },
    { week: '2026-W41', doneSeconds: 21600 },
    { week: '2026-W42', doneSeconds: 14400 },
    { week: '2026-W43', doneSeconds: 25200 },
    { week: '2026-W44', doneSeconds: 19800 },
    { week: '2026-W45', doneSeconds: 27000 },
    { week: '2026-W46', doneSeconds: 9000 },
    { week: '2026-W47', doneSeconds: 24120 },
  ],
};

/** Semaine sans objectif hebdomadaire défini : la carte propose de le définir. */
export const weeklyGoalWithoutTargetApi: WeeklyGoalApi = {
  ...weeklyGoalApi,
  targetSeconds: null,
};
