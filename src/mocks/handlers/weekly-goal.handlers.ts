import { http, HttpResponse } from 'msw';
import { weeklyGoalApi } from '../fixtures/weekly-goal.fixtures';
import { storedWeeklyTargetSeconds } from './user-settings.handlers';

/** Progression hebdomadaire de toute semaine demandée, avec la cible enregistrée dans les réglages. */
export const weeklyGoalHandlers = [
  http.get('*/api/settings/weekly-target/:week', ({ params }) =>
    HttpResponse.json({
      ...weeklyGoalApi,
      week: String(params['week']),
      targetSeconds: storedWeeklyTargetSeconds(),
    }),
  ),
];
