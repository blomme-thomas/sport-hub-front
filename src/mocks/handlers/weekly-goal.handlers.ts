import { http, HttpResponse } from 'msw';
import { weeklyGoalApi } from '../fixtures/weekly-goal.fixtures';

/** Cible hebdomadaire de toute semaine demandée, pour que le tableau de bord se charge sans back. */
export const weeklyGoalHandlers = [
  http.get('*/api/goals/weekly/:week', ({ params }) =>
    HttpResponse.json({ ...weeklyGoalApi, week: String(params['week']) }),
  ),
];
