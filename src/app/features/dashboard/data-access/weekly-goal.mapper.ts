import { weeklyGoalStatusOf } from '../config/weekly-goal-status';
import type { WeeklyGoalApi } from '../models/weekly-goal.api-model';
import type { WeeklyGoalView } from '../models/weekly-goal.model';
import { formatDuration } from './recent-activities.mapper';

const ABSENT = null;

/**
 * Réponse de l'API en vue de la carte. Le pourcentage et le statut sont dérivés ici : sans cible, ils restent absents
 * (jamais 0 %). Les champs manquants d'une réponse incomplète sont traités comme absents.
 */
export function toWeeklyGoalView(api: WeeklyGoalApi): WeeklyGoalView {
  const done = api.doneSeconds ?? 0;
  const target = api.targetSeconds ?? ABSENT;
  const hasTarget = target !== null && target > 0;
  const percent = hasTarget ? Math.round((done / target) * 100) : ABSENT;

  return {
    doneLabel: formatDuration(done),
    targetLabel: hasTarget ? formatDuration(target) : ABSENT,
    percent,
    statusMessage: percent === null ? ABSENT : weeklyGoalStatusOf(percent),
  };
}
