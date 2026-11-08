import type { NextEventFormatApi, NextEventGoalApi } from '../models/next-event.api-model';
import type { NextEvent } from '../models/next-event.model';

const MILLISECONDS_PER_DAY = 86_400_000;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

const FORMAT_LABELS: Record<NextEventFormatApi, string> = {
  sprint: 'Sprint',
  olympique: 'Olympique',
  half: 'Half (semi-distance)',
  full: 'Full (distance complète)',
  autre: 'Autre',
};

type UpcomingEventApi = NextEventGoalApi & { targetDate: string };

/**
 * Renvoie l'événement à venir le plus proche (`targetDate >= todayIso`, `YYYY-MM-DD`), ou `null` s'il n'y en a aucun.
 * Les objectifs qui ne sont pas des événements ou sans date sont ignorés ; à date égale, l'ordre de l'API est conservé.
 */
export function toNextEvent(
  goals: readonly NextEventGoalApi[],
  todayIso: string,
): NextEvent | null {
  const upcoming = goals.filter(
    (goal): goal is UpcomingEventApi =>
      goal.type === 'evenement' && goal.targetDate !== null && goal.targetDate >= todayIso,
  );
  upcoming.sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  const [next] = upcoming;
  return next === undefined ? null : toNextEventModel(next);
}

/**
 * Nombre de jours entiers entre `todayIso` et `targetDate` (deux dates `YYYY-MM-DD`), calculé en UTC.
 * Vaut 0 le jour même et ne dépend ni de l'heure ni du fuseau local.
 */
export function daysUntil(targetDate: string, todayIso: string): number {
  return (utcMidnight(targetDate) - utcMidnight(todayIso)) / MILLISECONDS_PER_DAY;
}

function toNextEventModel(goal: UpcomingEventApi): NextEvent {
  return {
    id: goal.id,
    title: goal.title,
    targetDate: goal.targetDate,
    formatLabel: goal.eventFormat === null ? null : FORMAT_LABELS[goal.eventFormat],
    targetTimeLabel:
      goal.targetTimeSeconds === null ? null : formatTargetTime(goal.targetTimeSeconds),
  };
}

function formatTargetTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${hours} h ${minutes} min ${seconds} s`;
}

function utcMidnight(iso: string): number {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  return Date.UTC(year, month - 1, day);
}
