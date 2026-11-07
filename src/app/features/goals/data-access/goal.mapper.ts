import type { CreateGoalRequestApi, GoalApi, UpdateGoalRequestApi } from '../models/goal.api-model';
import type { Goal, GoalInput, TargetTime, TargetTimeInput } from '../models/goal.model';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

export interface PartitionedGoals {
  upcoming: Goal[];
  past: Goal[];
  undated: Goal[];
}

/** Convertit un objectif de l'API en modèle UI ; un temps cible absent reste `null`. */
export function toGoal(api: GoalApi): Goal {
  return {
    id: api.id,
    title: api.title,
    type: api.type,
    targetDate: api.targetDate,
    eventFormat: api.eventFormat,
    targetTime: api.targetTimeSeconds === null ? null : secondsToParts(api.targetTimeSeconds),
  };
}

/**
 * Corps de création : le format et le temps cible ne sont envoyés que pour un événement,
 * les champs vides sont envoyés à `null`.
 */
export function toCreateRequest(input: GoalInput): CreateGoalRequestApi {
  return {
    title: input.title.trim(),
    type: input.type,
    targetDate: input.targetDate,
    eventFormat: input.type === 'evenement' ? input.eventFormat : null,
    targetTimeSeconds: input.type === 'evenement' ? partsToSeconds(input.targetTime) : null,
  };
}

/**
 * Corps de modification complet : `null` efface explicitement le format et le temps cible
 * lorsque l'objectif n'est plus un événement.
 */
export function toUpdateRequest(input: GoalInput): UpdateGoalRequestApi {
  return toCreateRequest(input);
}

/** Décompose un total de secondes en heures, minutes et secondes. */
export function secondsToParts(totalSeconds: number): TargetTime {
  return {
    hours: Math.floor(totalSeconds / SECONDS_PER_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  };
}

/**
 * Additionne heures, minutes et secondes en secondes.
 *
 * @returns `null` quand le temps est absent (champs vides ou tous à zéro), car le back ne reçoit alors aucun temps cible
 */
export function partsToSeconds(parts: TargetTimeInput): number | null {
  const total =
    (parts.hours ?? 0) * SECONDS_PER_HOUR +
    (parts.minutes ?? 0) * SECONDS_PER_MINUTE +
    (parts.seconds ?? 0);

  return total === 0 ? null : total;
}

/**
 * Répartit les objectifs selon `todayIso` (`YYYY-MM-DD`) : à venir si la date est ce jour ou après,
 * passée si elle est antérieure, sans date sinon. L'ordre d'origine est conservé.
 */
export function partitionGoals(goals: readonly Goal[], todayIso: string): PartitionedGoals {
  const partitioned: PartitionedGoals = { upcoming: [], past: [], undated: [] };

  for (const goal of goals) {
    if (goal.targetDate === null) {
      partitioned.undated.push(goal);
    } else if (goal.targetDate >= todayIso) {
      partitioned.upcoming.push(goal);
    } else {
      partitioned.past.push(goal);
    }
  }

  return partitioned;
}
